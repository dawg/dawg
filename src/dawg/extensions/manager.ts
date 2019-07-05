import * as t from 'io-ts';
import { Extension, ExtensionContext, IExtensionContext, ExtensionData } from '@/dawg/extensions';
import fs from '@/wrappers/fs';
import path from 'path';
import { GLOBAL_PATH, WORKSPACE_PATH, SETTINGS_PATH, PROJECT_PATH } from '@/constants';
import { reverse } from '@/utils';
import { FileLoader, FileWriter } from '@/core/loaders/file';
import uuid from 'uuid';

// TODO IF TWO instances of Vusic are opened at the same time
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

let extensionsStack: Array<{ extension: Extension<any, any, any, any>, context: IExtensionContext }> = [];

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
    const loader = new FileLoader(PastProjectsType, { path: PROJECT_PATH });
    const result = loader.load();

    if (result.type === 'error') {
      // TODO(jacob) LOG
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

    return new Manager(info, parsedProject, global, workspace, settings);
  }

  constructor(
    public projectInfo: ProjectInfo,
    public readonly parsedProject: JSON | null,
    public readonly global: JSON,
    public readonly workspace: JSON,
    public readonly settings: JSON,
  ) {}
}

export type ProjectInfo =
  { id: string, path: string } |
  { id: string, path: null };

let projectManager: Manager | null = null;

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
  async setOpenedFile(projectInfo?: ProjectInformation, opts: { isTemp?: boolean } = {}) {
    if (!projectManager) {
      projectManager = Manager.fromFileSystem();
    }

    // TODO
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

    const writer = new FileWriter(PastProjectsType, { path: PROJECT_PATH, data: pastProject });
    return await writer.write();
  },
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
    projectManager.workspace[projectManager.projectInfo.id] = w;

    await write(GLOBAL_PATH, g);
    await write(SETTINGS_PATH, s);
    await write(WORKSPACE_PATH, projectManager.workspace);
  },
  activate<W extends ExtensionData = {}, G extends ExtensionData = {}, S extends t.Props = {}, V = void>(
    extension: Extension<W, G, S, V>,
  ): V {
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
