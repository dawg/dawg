import firebase from 'firebase/app';

export interface ProjectInfo {
  id: string;
  name: string;
  initialSaveTime: number;
  lastUploadTime: number;
}

export interface SerializedProject {
  name: string;
}

export interface Error {
  type: 'error';
  message: string;
}

export interface Success {
  type: 'success';
}

export interface NotFound {
  type: 'not-found';
}

export interface ProjectFound {
  type: 'found';
  project: SerializedProject;
}

export interface Projects {
  type: 'success';
  projects: ProjectInfo[];
}

export interface Project extends ProjectInfo {
  project: SerializedProject;
}

export interface Schema {
  [id: string]: Project;
}

let db: null | firebase.database.Database = null;

const getRef = () => {
  if (!db) {
    db = firebase.database();
  }

  return db.ref('projects');
};

const withHandling = async <T>(
  f: () => Promise<T>,
): Promise<T | Error> => {
  try {
    return await f();
  } catch (e) {
    return {
      type: 'error',
      message: e.message,
    };
  }
};

const getProjects = async () => {
  return withHandling(async (): Promise<Projects> => {
    const snapshot = await getRef().orderByChild('lastUploadTime').once('value');

    if (!snapshot.exists()) {
      return {
        type: 'success',
        projects: [],
      };
    }

    const projects: Schema = snapshot.val();
    const info = Object.values(projects).map(({ id, name, initialSaveTime, lastUploadTime }) => {
      return { id, name, initialSaveTime, lastUploadTime };
    });

    return {
      type: 'success',
      projects: info,
    };
  });
};

const getProject = async (id: string) => {
  return withHandling(async (): Promise<NotFound | ProjectFound> => {
    const snapshot = await getRef().child(id).once('value');

    if (!snapshot.exists()) {
      return {
        type: 'not-found',
      };
    }

    return {
      type: 'found',
      project: (snapshot.val() as Project).project,
    };
  });
};

const deleteProject = async (id: string) => {
  getRef().child(id).remove();
};

const updateProject = async (id: string, project: SerializedProject) => {
  return await withHandling(async (): Promise<Success> => {
    const ref = getRef().child(id);
    const snapshot = await ref.once('value');

    const time = Date.now();

    if (!snapshot.exists()) {
      getRef().set({
        [id]: {
          name: project.name,
          id,
          initialSaveTime: time,
          lastUploadTime: time,
          project,
        } as Project,
      });
    } else {
      ref.update({
        project,
        lastUploadTime: time,
      } as Partial<Project>);
    }

    return {
      type: 'success',
    };
  });
};


export default {
  getProjects,
  getProject,
  deleteProject,
  updateProject,
};
