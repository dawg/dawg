import RestypedRouter from 'restyped-express-async';
import { BackupAPI } from '@dawgjs/specification';
import express from 'express';
import { DB } from 'lowdb';
import { ProjectInfo } from '@dawgjs/specification';
import bodyParser from 'body-parser';

// DB INTERFACE //
// Add project attribute
export interface Project extends ProjectInfo {
  project: object;
}

// tslint:disable-next-line:interface-over-type-literal
export type Schema = { projects: Project[]; };

export default (db: DB<Schema>) => {
  // SETUP FOR EXPRESS //
  const app = express();
  app.use(bodyParser.json());

  const apiRouter = express.Router();
  app.use('/', apiRouter);
  const router = RestypedRouter<BackupAPI>(apiRouter);

  // Set some defaults (required if your JSON file is empty)
  db.defaults({ projects: [] })
    .write();

  const collection = db.get('projects');

  // ROUTES //
  router.get('/health', async () => {
    //
  });

  router.get('/projects/names', async () => {
    const projects = collection.value();
    return Object.values(projects).map(({ id, name, initialSaveTime, lastUploadTime }) => {
      return { id, name, initialSaveTime, lastUploadTime };
    });
  });

  router.get('/projects/:id', async (req, res) => {
    const project = collection.find({ id: req.params.id }).value();

    if (!project) {
      res.status(404);
      return null;
    }

    return project.project;
  });

  router.post('/projects/:id', async (req, res) => {
    const time = Date.now();
    const project = collection.find({ id: req.params.id }).value();


    if (!project) {
      res.status(400);
      return;
    }

    collection
      .find({ id: req.params.id })
      .assign({
        project: req.body,
        info: { lastUploadTime: time },
      }).write();
  });

  router.delete('/projects/:id', async (req, res) => {
    const project = collection.find({ id: req.params.id }).value();

    if (!project) {
      res.status(404);
      return;
    }

    collection
      .remove({ id: req.params.id })
      .write();
  });

  router.post('/projects/:id/create', async (req, res) => {
    const time = Date.now();
    const project = collection.find({ id: req.params.id }).value();

    if (project) {
      res.status(400);
      return;
    }

    collection.push({
      name: req.body.name,
      id: req.params.id,
      initialSaveTime: time,
      lastUploadTime: time,
      project: req.body.project,
    }).write();
  });

  return app;
};
