import * as t from 'io-ts';
import {
  Extension,
  ExtensionContext,
  IExtensionContext,
  StateType,
  ExtensionProps,
  ReactiveDefinition,
  ExtensionDefaults,
} from '@/dawg/extensions';
import fs from '@/fs';
import path from 'path';
import { GLOBAL_PATH, WORKSPACE_PATH, PROJECT_PATH } from '@/constants';
import { reverse, keys } from '@/utils';
import { FileLoader, FileWriter } from '@/core/loaders/file';
import uuid from 'uuid';
import { value } from 'vue-function-api';
import { PathReporter } from 'io-ts/lib/PathReporter';
import { emitter } from '../events';

const events = emitter<{ setOpenedFile: () => void }>();

// FIXME IF TWO instances of Vusic are opened at the same time
// there will be an issue when writing to the fs because the
// data is loaded on startup and written back at the end. Thus,
// stuff can easily be overwritten

export const ProjectInformationType = t.type({
  path: t.string,
  id: t.string,
});

export const PastProjectsType = t.partial({
  projectPath: ProjectInformationType,
  tempPath: ProjectInformationType,
});

type ProjectInformation = t.TypeOf<typeof ProjectInformationType>;
type PastProject = t.TypeOf<typeof PastProjectsType>;

let pastProject: PastProject = {};

interface JSON {
  [k: string]: any;
}

const extensions: { [id: string]: any } = {};
const resolved: { [id: string]: boolean } = {};

let extensionsStack: Array<{ extension: Extension, context: IExtensionContext }> = [];

const makeAndRead = (file: string): JSON => {
  if (!fs.existsSync(file)) {
    const dir = path.dirname(file);
    fs.mkdirRecursiveSync(dir);
    fs.writeFileSync(file, JSON.stringify({}));
  }

  const contents = fs.readFileSync(file).toString();
  return JSON.parse(contents);
};

const write = async (file: string, contents: any) => {
  await fs.writeFile(file, JSON.stringify(contents, null, 4));
};

const getDataFromExtensions = (key: 'workspace' | 'global'): { [k: string]: ExtensionDefaults<ExtensionProps> } => {
  const data: { [k: string]: ExtensionDefaults<ExtensionProps> } = {};
  for (const { extension, context } of reverse(extensionsStack)) {
    try {
      const definition = extension[key];
      if (!definition) {
        continue;
      }

      const state = context[key];
      const toEncode: { [K in keyof typeof state]: t.TypeOf<StateType> | undefined } = {};
      for (const k of keys(state)) {
        toEncode[k] = state[k].value;
      }

      const type = t.partial(definition);
      const encoded = type.encode(toEncode);
      data[extension.id] = encoded;
    } catch (e) {
      // tslint:disable-next-line:no-console
      console.warn('' + e);
      // If there is an error, don't write anything to the fs
      // This will basically invalidate the cache (for that particular extension)
    }
  }

  return data;
};

const loadWorkspace = (projectId: string, file: string) => {
  const json = makeAndRead(file);
  if (!json[projectId]) {
    // tslint:disable-next-line:no-console
    console.info(`${projectId} does not exist in the project cache`);
    return {};
  }

  return json[projectId];
  // const decoded = io.deserialize(projectStuff, Specific);
};

class Manager {
  public static fromFileSystem() {
    const loader = new FileLoader(PastProjectsType, { path: PROJECT_PATH });
    const result = loader.load();

    if (result.type === 'error') {
      notificationQueue.push(`Unable to load previously opened project information. Opening blank project instead.`);
    } else {
      pastProject = result.decoded;
    }

    const createNewProjectInfo = (): ProjectInfo => {
      return { id: uuid.v4(), path: null };
    };

    type TempInfo = { isTemp: false, path: null } | { isTemp: true, path: string };

    const toOpen = pastProject.tempPath ? pastProject.tempPath : pastProject.projectPath;
    let info: ProjectInfo;
    let tempInfo: TempInfo = { isTemp: false, path: null };
    if (toOpen === undefined) {
      info = createNewProjectInfo();
    } else {
      if (pastProject.tempPath !== undefined) {
        tempInfo = { isTemp: true, path: toOpen.path };
      }

      info = { id: toOpen.id, path: toOpen.path };
    }

    const projectId = info.id;

    let projectContents: string | null = null;
    try {
      if (info.path) {
        projectContents = fs.readFileSync(info.path).toString();
      }
    } catch (e) {
      // tslint:disable-next-line:no-console
      console.error(`Unable to load project from ${info.path}: ${e.message}`);

      // If we throw an error while opening the file, set the opened file to null
      info = createNewProjectInfo();
    }

    if (tempInfo.isTemp) {
      // Always remove temporary information once the file has been read
      // Even if there are errors we do this
      fs.unlink(tempInfo.path);
      pastProject.tempPath = undefined;
      const writer = new FileWriter(PastProjectsType, { path: PROJECT_PATH, data: pastProject });
      writer.write();
    }

    let parsedProject: JSON | null = null;
    try {
      if (projectContents) {
        parsedProject = JSON.parse(projectContents);
      }
    } catch (e) {
      // tslint:disable-next-line:no-console
      console.error(`Unable to parse project ${info.path}: ${e.message}`);

      // Same thing with parsing the file
      // If we can't actually parse the file, then we haven't actually opened the file
      info = createNewProjectInfo();
    }

    let global: JSON = {};
    let workspace: JSON = {};

    try {
      global = makeAndRead(GLOBAL_PATH);
    } catch (e) {
      // tslint:disable-next-line:no-console
      console.error(`Unable to load workspace at ${GLOBAL_PATH}: ${e.message}`);
    }

    try {
      workspace = loadWorkspace(projectId, WORKSPACE_PATH);
    } catch (e) {
      // tslint:disable-next-line:no-console
      console.error(`Unable to load workspace at ${WORKSPACE_PATH}: ${e.message}`);
    }

    return new Manager(info, parsedProject, global, workspace);
  }

  constructor(
    public projectInfo: ProjectInfo,
    public readonly parsedProject: JSON | null,
    public readonly global: JSON,
    public readonly workspace: JSON,
  ) {}
}

export type ProjectInfo =
  { id: string, path: string } |
  { id: string, path: null };

let projectManager: Manager | null = null;

// FIXME(1) Add interface with message, description, showUser
// Also, write to file
const notificationQueue: string[] = [];

export const manager = {
  getOpenedFile() {
    if (!projectManager) {
      projectManager = Manager.fromFileSystem();
    }

    return projectManager.projectInfo.path;
  },
  getProjectJSON() {
    if (!projectManager) {
      projectManager = Manager.fromFileSystem();
    }

    return projectManager.parsedProject;
  },
  onDidSetOpenedFile(listener: () => void) {
    events.addListener('setOpenedFile', listener);
    return {
      dispose() {
        events.removeListener('setOpenedFile', listener);
      },
    };
  },
  async setOpenedFile(projectInfo?: ProjectInformation, opts: { isTemp?: boolean } = {}) {
    if (!projectManager) {
      projectManager = Manager.fromFileSystem();
    }

    if (projectInfo) {
      projectManager.projectInfo = projectInfo;
    } else {
      projectManager.projectInfo = {
        id: projectManager.projectInfo.id,
        path: null,
      };
    }

    if (opts.isTemp) {
      pastProject.tempPath = projectInfo;
    } else {
      pastProject.projectPath = projectInfo;
    }

    events.emit('setOpenedFile');

    const writer = new FileWriter(PastProjectsType, { path: PROJECT_PATH, data: pastProject });
    return await writer.write();
  },
  async dispose() {
    if (!projectManager) {
      return;
    }

    for (const e of reverse(extensionsStack)) {
      if (e.extension.deactivate) {
        try {
          await e.extension.deactivate(e.context);
        } catch (error) {
          // tslint:disable-next-line:no-console
          notificationQueue.push(`Unable to deactivate ${e.extension.id}: ${error}`);
          // tslint:disable-next-line:no-console
          console.error(`Unable to deactivate ${e.extension.id}: ${error}`);
        }
      }

      e.context.subscriptions.forEach((subscription) => {
        try {
          subscription.dispose();
        } catch (error) {
          // tslint:disable-next-line:no-console
          notificationQueue.push(`Unable to deactivate subscription for ${e.extension.id}: ${error}`);
          // tslint:disable-next-line:no-console
          console.error(`Unable to deactivate subscription for ${e.extension.id}: ${error}`);
        }
      });
    }

    const g = getDataFromExtensions('global');
    const w = getDataFromExtensions('workspace');

    projectManager.workspace[projectManager.projectInfo.id] = w;

    await write(GLOBAL_PATH, g);
    await write(WORKSPACE_PATH, projectManager.workspace);
  },
  // tslint:disable-next-line:max-line-length
  activate<W extends ExtensionProps, WD extends ExtensionDefaults<W>, G extends ExtensionProps, V, GD extends ExtensionDefaults<G>>(
    extension: Extension<W, WD, G, GD, V>,
  ): V {
    if (!projectManager) {
      projectManager = Manager.fromFileSystem();
    }

    // tslint:disable-next-line:no-console
    console.info('Activating ' + extension.id);
    resolved[extension.id] = false;
    manager.activating.push(extension);

    const getOrEmptyObject = (o: JSON, key: string) => {
      return o[key] === undefined ? {} : o[key];
    };

    const makeReactive = <
      P extends ExtensionProps,
      D extends ExtensionDefaults<P>,
    >(definition: P | undefined, defaults: D | undefined, o: any) => {
      if (!definition) {
        return {} as ReactiveDefinition<P, D>;
      }

      const type = t.partial(definition);
      const result = type.decode(o);
      let decoded: typeof result['_A'];
      if (result.isLeft()) {
        notificationQueue.push(
          ...PathReporter.report(result),
        );

        // tslint:disable-next-line:no-console
        console.error(PathReporter.report(result).join('\n'));
        decoded = {};
      } else {
        decoded = result.value;
      }

      const reactive = {} as ReactiveDefinition<P, D>;

      for (const key of keys(definition)) {
        let decodedValue = decoded[key];
        if (decodedValue === undefined && defaults) {
          decodedValue = defaults[key];
        }

        // FIXME remove this any
        reactive[key] = value(decodedValue as any);
      }

      return reactive;
    };

    const w = getOrEmptyObject(projectManager.workspace, extension.id);
    const g = getOrEmptyObject(projectManager.global, extension.id);

    const reactiveWorkspace = makeReactive(extension.workspace, extension.workspaceDefaults, w);
    const reactiveGlobal = makeReactive(extension.global, extension.globalDefaults, g);

    const context = new ExtensionContext<W, WD, G, GD>(reactiveWorkspace, reactiveGlobal);

    // beware of the any type
    const api = extension.activate(context);

    extensions[extension.id] = api;
    manager.activating.pop();
    resolved[extension.id] = true;
    extensionsStack.push({ extension, context });

    return api;
  },
  deactivateAll() {
    // since we are resetting the stack, we can reverse in place
    extensionsStack.reverse().forEach(({ extension, context }) => {
      if (extension.deactivate) {
        extension.deactivate(context);
      }
    });

    extensionsStack = [];
  },
  get<T extends Extension<any, any, any>>(extension: T): ReturnType<T['activate']> {
    // tslint:disable-next-line:no-console
    console.log(resolved, extension.id);
    if (extensions.hasOwnProperty(extension.id)) {
      if (!resolved[extension.id]) {
        throw Error(`Circular dependency detected with ${extension.id}`);
      }
    } else {
      resolved[extension.id] = false;
      manager.activate(extension);
    }

    return extensions[extension.id] as ReturnType<T['activate']>;
  },
  notificationQueue,
  activating: [] as Extension[],
};
