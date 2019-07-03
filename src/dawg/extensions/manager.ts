import * as t from 'io-ts';
import { Extension, ExtensionContext, IExtensionContext } from '@/dawg/extensions';
import fs from '@/wrappers/fs';
import path from 'path';
import { GLOBAL_PATH, WORKSPACE_PATH, SETTINGS_PATH, PROJECT_PATH } from '@/constants';
import { Project } from '@/store';
import { reverse } from '@/utils';
import { FileLoader } from '@/core/loaders/file';
import uuid from 'uuid';

// TODO IF TWO instances of Vusic are opened at the same time
// there will be an issue when writing to the fs because the
// data is loaded on startup and written back at the end. Thus,
// stuff can easily be overwritten

export const ProjectContextInformation = t.type({
  path: t.string,
  id: t.string,
});

export const PastProjectsType = t.partial({
  projectPath: ProjectContextInformation,
  tempPath: ProjectContextInformation,
});

type PastProjects = t.TypeOf<typeof PastProjectsType>;

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

const getDataFromExtensions = (key: 'workspace' | 'global' | 'settings') => {
  const data: { [k: string]: string } = {};
  for (const { extension, context } of reverse(extensionsStack)) {
    try {
      data[extension.id] = JSON.stringify(context[key].getData());
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
    // TODO(jacob) remove class ahhh
    const loader = new FileLoader(PastProjectsType, { path: PROJECT_PATH });
    const result = loader.load();

    let pastProjects: PastProjects;
    if (result.type === 'error') {
      // TODO(jacob) LOG
      pastProjects = {};
    } else {
      pastProjects = result.decoded;
    }

    const toOpen = pastProjects.tempPath ? pastProjects.tempPath : pastProjects.projectPath;
    const projectId = toOpen ? toOpen.id : uuid.v4();

    // let project: Project;
    // if (!toOpen) {
      // project = Project.newProject();
    // } else {
    //   const l = new FileLoader(ProjectType, { path: toOpen });
    //   const r = l.load();
    //   if (r.type === 'error') {
    //     // TODO(jacob) LOG WITH EVENTS MAYBE OR A QUEUE
    //     project = Project.newProject();
    //   } else {
    //     // TODO(jacob) catch errors ahhhhhh
    //     project = await Project.load(r.decoded);
    //   }
    // }

    let global: JSON = {};
    let workspace: JSON = {};
    let settings: JSON = {};

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

    try {
      settings = makeAndRead(SETTINGS_PATH);
    } catch (e) {
      // tslint:disable-next-line:no-console
      console.error(`Unable to load settings at ${SETTINGS_PATH}: ${e.message}`);
    }

    return new Manager(projectId, global, workspace, settings);
  }

  constructor(
    public readonly projectId: string,
    public readonly global: JSON,
    public readonly workspace: JSON,
    public readonly settings: JSON,
  ) {}
}

let projectManager: Manager | null = null;

export const manager = {
  // TODO USE THIS
  async dispose() {
    if (!projectManager) {
      return;
    }

    for (const e of reverse(extensionsStack)) {
      if (e.extension.deactivate) {
        e.extension.deactivate(e.context);
      }
    }

    const g = getDataFromExtensions('global');
    const s = getDataFromExtensions('settings');
    const w = getDataFromExtensions('workspace');

    // TODO(jacob) consider folder structure
    projectManager.workspace[projectManager.projectId] = w;

    await write(GLOBAL_PATH, g);
    await write(SETTINGS_PATH, s);
    await write(WORKSPACE_PATH, projectManager.workspace);
  },
  activate<E extends Extension<any, any, any, any>>(extension: E): ReturnType<E['activate']> {
    if (!projectManager) {
      projectManager = Manager.fromFileSystem();
    }

    // tslint:disable-next-line:no-console
    console.info('Activating ' + extension.id);
    resolved[extension.id] = false;

    const w = projectManager.workspace[extension.id] || {};
    const g = projectManager.global[extension.id] || {};
    const s = projectManager.settings[extension.id] || {};

    const context = new ExtensionContext(w, g, s);

    // beware of the any type
    const api = extension.activate(context);

    extensions[extension.id] = api;
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
  get<V, T extends Extension<any, any, any, any>>(extension: T): ReturnType<T['activate']> {
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
};
