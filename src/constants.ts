import path from 'path';
import { remote } from 'electron';

const { app } = remote;

export const DG = 'dg';
export const DG_EXTENSION = `.${DG}`;
export const APPLICATION_PATH = path.join(app.getPath('appData'), app.getName());
export const GLOBAL_PATH = path.join(APPLICATION_PATH, 'global.json');
export const WORKSPACE_PATH = path.join(APPLICATION_PATH, 'workspace.json');
export const PROJECT_PATH = path.join(APPLICATION_PATH, 'project.json');
export const DOCUMENTS_PATH = app.getPath('documents');
export const RECORDING_PATH = path.join(DOCUMENTS_PATH, app.getName(), 'recordings');
export const FILTERS = [{ name: 'DAWG Files', extensions: [DG] }];
export const TOOLBAR_HEIGHT = 64;
export const STATUS_BAR_HEIGHT = 25;
