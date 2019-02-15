import supertest from 'supertest';
import low, { DB } from 'lowdb';
import Memory from 'lowdb/adapters/Memory';
import make, { Schema, Project } from './app';

const makeDefaults = () => {
  const db = low<Schema>(new Memory());
  const app = make(db);
  const request = supertest(app);
  return { db, app, request };
};

const insertSimple = (db: DB<Schema>) => {
  const time = Date.now();
  const project = {
    id: 'id',
    name: 'T1',
    lastUploadTime: time,
    initialSaveTime: time,
    project: { a: 'project' },
  };

  db.get('projects')
    .push(project)
    .write();

  return project;
};


describe('server', () => {
  it('can add two numbers', () => {
    const sum: number = 2 + 2;
    expect(sum).toBe(4);
  });

  describe('/health', () => {
    it('should return 200 OK', async () => {
      const { request } = makeDefaults();
      const result = await request.get('/health');
      expect(result.status).toEqual(200);
    });
  });

  describe('/projects/names', async () => {
    it('should return empty list', async () => {
      const { request } = makeDefaults();
      const result = await request.get('/projects/names');
      expect(result.body).toEqual([]);
    });

    it('should return info', async () => {
      const { request, db } = makeDefaults();
      const info = insertSimple(db);
      delete info.project;
      const result = await request.get('/projects/names');
      expect(result.body).toEqual([info]);
    });
  });

  describe('/projects/:id', () => {
    it('should return project', async () => {
      const { request, db } = makeDefaults();
      const project = insertSimple(db);
      const result = await request.get(`/projects/${project.id}`);
      expect(result.body).toEqual(project.project);
    });

    it('should update project', async () => {
      const { request, db } = makeDefaults();
      const project = insertSimple(db);
      const url = `/projects/${project.id}`;
      await request.post(url).send({ project: 'a' });
      const result = await request.get(url);
      expect(result.body).toEqual({ project: 'a' });
    });

    it('should delete project', async () => {
      const { request, db } = makeDefaults();
      const project = insertSimple(db);
      const url = `/projects/${project.id}`;
      await request.delete(url);
      expect(db.get('projects').value()).toEqual([]);
    });
  });

  describe('/projects/:id/create', async () => {
    it('should create', async () => {
      const { request, db } = makeDefaults();
      await request.post(`/projects/theid/create`).send({ name: 'jacob', project: { a: 'project' } });

      let project = db.get('projects').find({ id: 'theid' }).value();
      expect(project).toBeDefined();

      project = project as Project;
      expect(project.name).toEqual('jacob');
      expect(project.project).toEqual({ a: 'project' });
      expect(project.id).toEqual('theid');
      expect(project.lastUploadTime).toEqual(project.initialSaveTime);
    });
  });
});

