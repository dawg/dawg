import path from 'path';
import { remote } from 'electron';

const { app } = remote;

export const DG = 'dg';
export const DG_EXTENSION = `.${DG}`;
export const APP_DATA = app.getPath('appData');
export const GLOBAL_PATH = path.join(APP_DATA, 'global.json');
export const WORKSPACE_PATH = path.join(APP_DATA, 'workspace.json');
export const PROJECT_PATH = path.join(APP_DATA, 'project.json');
export const APPLICATION_PATH = path.join(APP_DATA, app.getName());
export const DOCUMENTS_PATH = app.getPath('documents');
export const RECORDING_PATH = path.join(DOCUMENTS_PATH, app.getName(), 'recordings');
export const FILTERS = [{ name: 'DAWG Files', extensions: [DG] }];
export const TOOLBAR_HEIGHT = 64;
export const STATUS_BAR_HEIGHT = 25;
