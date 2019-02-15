export interface ProjectInfo {
  id: string;
  name: string;
  initialSaveTime: number;
  lastUploadTime: number;
}

export interface BackupAPI {
  '/projects/names': {
    GET: {
      response: ProjectInfo[],
    },
  };

  '/projects/:id': {
    GET: {
      params: {
        id: string,
      }
      response: any,
    }
    POST: {
      params: {
        id: string,
      },
      body: any,
    },
  };

  '/projects/:id/create': {
    POST: {
      params: {
        id: string,
      },
      body: {
        project: any,
        name: string,
      },
    },
  };

}
