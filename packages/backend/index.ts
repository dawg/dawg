import low from 'lowdb';
import FileSync from 'lowdb/adapters/FileSync';
import make, { Schema } from './app';

// SETUP FOR DB //
const adapter = new FileSync('db.json');
const db = low<Schema>(adapter);

// MAKE actual APP //
const app = make(db);

// CONFIG //
const port = process.env.PORT || 3000;

app.listen(port, () => {
  // tslint:disable-next-line:no-console
  console.info(`BACKEND listening on port ${port}!`);
});
