import RestypedRouter from 'restyped-express-async';
import { BackupAPI, NotFound, ProjectFound, Success } from '@dawgjs/specification';
import express from 'express';
import { DB } from 'lowdb';
import { ProjectInfo } from '@dawgjs/specification';
import bodyParser from 'body-parser';
import cors from 'cors';

// DB INTERFACE //
// Add project attribute
export interface Project extends ProjectInfo {
  project: {
    name: string; // TODO(jacob)
  };
}

// tslint:disable-next-line:interface-over-type-literal
export type Schema = { projects: Project[]; };

export default (db: DB<Schema>) => {
  // SETUP FOR EXPRESS //
  const app = express();
  app.use(bodyParser.json());

  app.use(cors());

  const apiRouter = express.Router();
  app.use('/', apiRouter);
  const router = RestypedRouter<BackupAPI>(apiRouter);

  // Set some defaults (required if your JSON file is empty)
  db.defaults({ projects: [] })
    .write();

  const collection = db.get('projects');

  // ROUTES //
  // You must specify the return type or else TS will complain
  router.get('/health', async () => {
    return 'OK'
  });

  router.get('/projects/names', async () => {
    const all = collection.value();
    const projects = Object.values(all).map(({ id, name, initialSaveTime, lastUploadTime }) => {
      return { id, name, initialSaveTime, lastUploadTime };
    })

    return {
      type: 'success' as 'success',
      projects,
    }
  });

  router.get('/projects/:id', async (req, res): Promise<NotFound | ProjectFound> => {
    const time = Date.now();
    const project = collection.find({ id: req.params.id }).value();

    if (!project) {
      res.status(404);
      return {
        type: 'not-found'
      };
    }

    return {
      type: 'found',
      project: project.project
    };
  });

  router.post('/projects/:id', async (req): Promise<NotFound | Success> => {
    const time = Date.now();
    const project = collection.find({ id: req.params.id }).value();


    if (!project) {
      if (!project) {
        collection.push({
          name: req.body.name,
          id: req.params.id,
          initialSaveTime: time,
          lastUploadTime: time,
          project: req.body,
        }).write();
      }
    } else {
      collection
      .find({ id: req.params.id })
      .assign({
        project: req.body,
        info: { lastUploadTime: time },
      }).write();
    }

    return {
      type: 'success'
    }
  });

  router.delete('/projects/:id', async (req, res): Promise<NotFound | Success> => {
    const project = collection.find({ id: req.params.id }).value();

    if (!project) {
      res.status(404);
      return {
        type: 'not-found'
      };
    }

    collection
      .remove({ id: req.params.id })
      .write();

    return {
      type: 'success'
    }
  });

  return app;
};
