import axios, { TypedAxiosRequestConfig } from 'restyped-axios';
import { BackupAPI, Error, Project } from '@dawgjs/specification';

const isDev = process.env.NODE_ENV !== 'production';
const baseURL = isDev ? 'http://localhost:3000/' : '';
const client = axios.create<BackupAPI>({ baseURL });

const send = async <T extends TypedAxiosRequestConfig<any, any, any>>(
  f: () => Promise<T>,
): Promise<T['data'] | Error> => {
  try {
    const res = await f();
    return res.data;
  } catch (e) {
    return {
      type: 'error',
      message: e.message,
    };
  }
};

const getProjects = async () => {
  return send(() => client.request({ url: '/projects/names' }));
};

const getProject = async (id: string) => {
  return send(() => client.get<'/projects/:id'>(`/projects/${id}`));
};

const deleteProject = async (id: string) => {
  return send(() => client.delete<'/projects/:id'>(`/projects/${id}`));
};

const updateProject = async (id: string, project: Project) => {
  return send(() => client.post<'/projects/:id'>(`/projects/${id}`, project));
};


export default {
  getProjects,
  getProject,
  deleteProject,
  updateProject,
};
