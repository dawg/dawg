import axios from 'restyped-axios';
import { BackupAPI, ProjectInfo } from '@dawgjs/specification';

const isDev = process.env.NODE_ENV !== 'production';
const baseURL = isDev ? 'http://localhost:3000/' : '';
const client = axios.create<BackupAPI>({ baseURL });

interface Projects {
  type: 'success';
  projects: ProjectInfo[];
}

const getProjects = async (): Promise<Error | Projects> => {
  const res = await client.request({
    url: '/projects/names',
  });

  if (res.status !== 200) {
    return {
      type: 'error',
    };
  }

  return {
    type: 'success',
    projects: res.data,
  };
};

interface Error {
  type: 'error';
}

interface Success {
  type: 'success';
}

interface NotFound {
  type: 'not-found';
}

interface ProjectFound {
  type: 'found';
  project: any;
}

const getProject = async (id: string): Promise<Error | ProjectFound | NotFound> => {
  const res = await client.get<'/projects/:id'>(`/projects/${id}`);

  if (res.status === 404) {
    return {
      type: 'not-found',
    };
  }

  if (res.status !== 200) {
    return {
      type: 'error',
    };
  }

  return {
    type: 'found',
    project: res.data,
  };
};

const createProject = async (id: string, name: string, project: any): Promise<Error | Success> => {
  const res = await client.post<'/projects/:id/create'>(
    `/projects/${id}/create`,
    {
      project,
      name,
    },
  );

  if (res.status !== 200) {
    return {
      type: 'error',
    };
  }

  return {
    type: 'success',
  };
};

const deleteProject = async (id: string): Promise<NotFound | Error | Success> => {
  const res = await client.delete<'/projects/:id'>(`/projects/${id}`);

  if (res.status === 400) {
    return {
      type: 'not-found',
    };
  }

  if (res.status !== 200) {
    return {
      type: 'error',
    };
  }

  return {
    type: 'success',
  };
};


export default {
  getProjects,
  getProject,
  createProject,
  deleteProject,
};
