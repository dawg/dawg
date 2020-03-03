import * as t from '@/lib/io';
import {
  Extension,
  createExtensionContext,
  IExtensionContext,
  StateType,
  ExtensionData,
  ExtensionProps,
  FieldOptions,
  ReactiveDefinition,
  Setting,
  TypeOrOptions,
} from '@/lib/framework/extensions';
import fs from '@/lib/fs';
import path from 'path';
import { GLOBAL_PATH, WORKSPACE_PATH, PROJECT_PATH } from '@/lib/framework/constants';
import { reverse, keys } from '@/lib/std';
import uuid from 'uuid';
import { ref } from '@vue/composition-api';
import { emitter } from '@/lib/events';
import { decodeItem } from '@/lib/io';
import { getLogger } from '@/lib/log';

const logger = getLogger('manager');

const events = emitter<{ setOpenedFile: [] }>();

// FIXME IF TWO instances of DAWG are opened at the same time
// there will be an issue when writing to the fs because the
// data is loaded on startup and written back at the end. Thus,
// stuff can easily be overwritten

export const PastProjectsType = t.partial({
  projectPath: t.string,
  tempPath: t.string,
});

// To try and parse the ID from the project file
export const ProjectIdType = t.type({
  id: t.string,
});

type ProjectID = t.TypeOf<typeof ProjectIdType>;

type PastProject = t.TypeOf<typeof PastProjectsType>;

let pastProject: PastProject = {};

interface JSON {
  [k: string]: any;
}

const settings: Array<{ title: string, settings: Setting[] }> = [];
const extensions: { [id: string]: any } = {};
const resolved: { [id: string]: boolean } = {};

const extensionsStack: Array<
  { extension: Extension, context: IExtensionContext }
> = [];

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

const isState = (oo: TypeOrOptions): oo is StateType => {
  return (oo as any)._tag !== undefined;
};

const isFieldOptions = (oo: TypeOrOptions): oo is FieldOptions<StateType> => {
  return (oo as any)._tag === undefined;
};

const getPartialFromDefinition = (props: ExtensionProps) => {
  const partial: t.Props = {};
  Object.keys(props).forEach((key) => {
    const fieldInformation = props[key];
    partial[key] = isState(fieldInformation) ? fieldInformation : fieldInformation.type;
  }, {});
  return t.partial(partial);
};

const getDataFromExtensions = (key: 'workspace' | 'global'): { [k: string]: ExtensionData<ExtensionProps> } => {
  const data: { [k: string]: ExtensionData<ExtensionProps> } = {};
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

      const type = getPartialFromDefinition(definition);
      const encoded = type.encode(toEncode);
      data[extension.id] = encoded;
    } catch (e) {
      logger.warn('' + e);
      // If there is an error, don't write anything to the fs
      // This will basically invalidate the cache (for that particular extension)
    }
  }

  return data;
};

const loadWorkspace = (projectId: string, file: string) => {
  const json = makeAndRead(file);
  if (!json[projectId]) {
    logger.debug(`${projectId} does not exist in the project cache`);
    return {};
  }

  return json[projectId];
};

class Manager {
  public static fromFileSystem() {
    const result = t.read(PastProjectsType, { path: PROJECT_PATH });

    if (result.type === 'error') {
      logger.error(
        `Unable to load previously opened project information. ` +
        `Opening blank project instead. Error message:` + result.message,
      );
    } else {
      pastProject = result.decoded;
    }

    const toOpen = pastProject.tempPath ? pastProject.tempPath : pastProject.projectPath;
    let projectContents: string | null = null;
    if (toOpen) {
      try {
        projectContents = fs.readFileSync(toOpen).toString();
      } catch (e) {
        logger.error(`Unable to load project from ${toOpen}: ${e.message}`);
      }
    }

    const isTemp = !!pastProject.tempPath;  // save this information for later
    if (pastProject.tempPath) {
      // Always remove temporary information once the file has been read
      // Even if there are errors we do this
      fs.unlink(pastProject.tempPath);

      // Make sure we don't overwrite the projectPath since tempPath takes priority
      pastProject.tempPath = undefined;

      // Btw no error handling here. If this fails there isn't much we can do anyway.
      t.write(PastProjectsType, { path: PROJECT_PATH, data: pastProject });
    }

    let parsedProject: JSON | null = null;
    try {
      if (projectContents) {
        parsedProject = JSON.parse(projectContents);
      }
    } catch (e) {
      logger.error(`Unable to parse project ${toOpen}: ${e.message}`);
    }

    let info: ProjectInfo | null = null;
    if (parsedProject) {
      const r = decodeItem(ProjectIdType, parsedProject);
      if (r.type === 'success') {
        info = {
          // toOpen has to be defined at this point given that the project has been decoded
          path: toOpen!,
          id: r.decoded.id,
        };
      } else {
        logger.error(`Unable to parse ID from project: ${toOpen}: ${r.message}`);
      }
    }

    if (!info) {
      info = { id: uuid.v4(), path: null };
    }

    // We don't want to expose the path to the user when we open a tmp project.
    // We we some reason fail to load the temp project then this does nothing.
    // Since we this, when a user attempts to save, it will automatically open a save dialog.
    if (isTemp) {
      info.path = null;
    }

    let global: JSON = {};
    let workspace: JSON = {};

    try {
      global = makeAndRead(GLOBAL_PATH);
    } catch (e) {
      logger.error(`Unable to load global at ${GLOBAL_PATH}: ${e.message}`);
    }

    try {
      workspace = loadWorkspace(info.id, WORKSPACE_PATH);
    } catch (e) {
      logger.error(`Unable to load workspace at ${WORKSPACE_PATH}: ${e.message}`);
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

const projectManager = Manager.fromFileSystem();

export const manager = {
  getOpenedFile() {
    return projectManager.projectInfo.path;
  },
  getProjectJSON() {
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
  /**
   * Sets the path of the opened file and writes this information to the file system so that the next time the DAW is
   * opened, the correct file will open. Note that is NOT possible to change the ID of the currently opened project.
   *
   * @param projectPath The project path.
   * @param opts The options.
   */
  setOpenedFile(projectPath?: string, opts: { isTemp?: boolean } = {}) {
    if (projectPath) {
      projectManager.projectInfo.path = projectPath;
    } else {
      projectManager.projectInfo = {
        id: projectManager.projectInfo.id,
        path: null,
      };
    }

    if (opts.isTemp) {
      pastProject.tempPath = projectPath;
    } else {
      pastProject.projectPath = projectPath;
    }

    events.emit('setOpenedFile');

    return t.write(PastProjectsType, { path: PROJECT_PATH, data: pastProject });
  },
  /**
   * To be called at the end right before the application closes.
   */
  async dispose() {
    if (!projectManager) {
      return;
    }

    for (const e of reverse(extensionsStack)) {
      if (e.extension.deactivate) {
        try {
          await e.extension.deactivate(e.context);
        } catch (error) {
          logger.error(`Unable to deactivate ${e.extension.id}: ${error}`);
        }
      }

      e.context.subscriptions.forEach((subscription) => {
        try {
          subscription.dispose();
        } catch (error) {
          logger.error(`Unable to deactivate subscription for ${e.extension.id}: ${error}`);
        }
      });
    }

    const g = getDataFromExtensions('global');
    const w = getDataFromExtensions('workspace');

    // If there is no file set then do not write workspace to the fs because it is irrelevant
    if (projectManager.projectInfo.path) {
      projectManager.workspace[projectManager.projectInfo.id] = w;
    }

    await write(GLOBAL_PATH, g);
    await write(WORKSPACE_PATH, projectManager.workspace);
  },
  activate<W extends ExtensionProps, G extends ExtensionProps, V>(
    extension: Extension<W, G, V>,
  ): V {
    logger.debug('Activating ' + extension.id);
    resolved[extension.id] = false;
    manager.activating.push(extension);

    const getOrEmptyObject = (o: JSON, key: string) => {
      return o[key] === undefined ? {} : o[key];
    };

    const makeReactive = <
      P extends ExtensionProps
    >(extensionProps: P | undefined, o: any) => {
      if (!extensionProps) {
        return {} as ReactiveDefinition<P>;
      }

      const type = getPartialFromDefinition(extensionProps);

      const result = t.decodeItem(type, o);
      let decoded: t.TypeOf<typeof type>;
      if (result.type === 'error') {
        logger.error(result.message);
        decoded = {};
      } else {
        decoded = result.decoded;
      }

      const reactive = {} as ReactiveDefinition<P>;

      for (const key of keys(extensionProps)) {
        const props = extensionProps[key];
        let decodedValue = decoded[key];
        if (decodedValue === undefined && isFieldOptions(props)) {
          decodedValue = props.default;
        }

        // FIXME remove these weird casts
        reactive[key as keyof typeof reactive] = ref(decodedValue) as any;
      }

      return reactive;
    };

    const w = getOrEmptyObject(projectManager.workspace, extension.id);
    const g = getOrEmptyObject(projectManager.global, extension.id);

    const reactiveWorkspace = makeReactive(extension.workspace, w);
    const reactiveGlobal = makeReactive(extension.global, g);

    const context = createExtensionContext<W, G>(reactiveWorkspace, reactiveGlobal);
    settings.push({
      title: extension.name || extension.id,
      settings: context.settings,
    });

    const api = extension.activate(context);

    extensions[extension.id] = api;
    manager.activating.pop();
    resolved[extension.id] = true;
    extensionsStack.push({ extension: extension as Extension, context: context as IExtensionContext });

    return api;
  },
  get<T extends Extension<any, any, any>>(extension: T): ReturnType<T['activate']> {
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
  activating: [] as Array<Extension<any, any, any>>,
  settings,
};
