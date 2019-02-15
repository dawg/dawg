import RestypedRouter from 'restyped-express-async';
import { BackupAPI } from '@dawgjs/specification';
import express from 'express';
import low from 'lowdb';
import FileSync from 'lowdb/adapters/FileSync';
import { ProjectInfo } from '@dawgjs/specification';

// SETUP FOR EXPRESS //
const app = express();
const apiRouter = express.Router();
app.use('/api', apiRouter);
const router = RestypedRouter<BackupAPI>(apiRouter);

// CONFIG //
const port = process.env.PORT || 3000;

// SETUP FOR DB //
const adapter = new FileSync('db.json');
const db = low<{ projects: Project[] }>(adapter);

// Set some defaults (required if your JSON file is empty)
db.defaults({ projects: [] })
  .write();

const collection = db
  .defaults({ projects: [] })
  .get('projects');

// DB INTERFACE //
export interface Project extends ProjectInfo {
  project: any;
}

// ROUTES //
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
      project: req.body.project,
      info: { lastUploadTime: time },
    }).write();
});

router.post('/projects/:id/create', async (req, res) => {
  const time = Date.now();
  const project = collection.find({ id: req.params.id }).value();

  if (project) {
    res.status(400);
    return;
  }

  collection.insert({
    name: req.body.name,
    id: req.params.id,
    initialSaveTime: time,
    lastUploadTime: time,
    project: req.body,
  }).write();
});


app.listen(port, () => {
  // tslint:disable-next-line:no-console
  console.info(`BACKEND listening on port ${port}!`);
});
