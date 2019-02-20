export interface ProjectInfo {
  id: string;
  name: string;
  initialSaveTime: number;
  lastUploadTime: number;
}

export interface Project {
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
  project: Project;
}

export interface Projects {
  type: 'success';
  projects: ProjectInfo[];
}

export interface BackupAPI {
  '/health': {
    GET: {
      //
    },
  };

  '/projects/names': {
    GET: {
      response: Projects | Error,
    },
  };

  '/projects/:id': {
    GET: {
      params: {
        id: string,
      }
      response: NotFound | ProjectFound | Error,
    }
    POST: {
      params: {
        id: string,
      },
      body: Project,
      response: NotFound | Success | Error,
    },
    DELETE: {
      params: {
        id: string,
      },
      response: NotFound | Success | Error,
    },
  };

}
