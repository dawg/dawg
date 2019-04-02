import path from 'path';
import { remote } from 'electron';

const { app } = remote;

export const DG = 'dg';
export const DG_EXTENSION = `.${DG}`;
export const APP_DATA = app.getPath('appData');
export const APPLICATION_PATH = path.join(APP_DATA, app.getName());
export const DOCUMENTS_PATH = app.getPath('documents');
export const RECORDING_PATH = path.join(DOCUMENTS_PATH, app.getName(), 'recordings');
export const FILTERS = [{ name: 'DAWG Files', extensions: [DG] }];

export type ApplicationContext = 'playlist' | 'pianoroll';
export type SideTab = 'Explorer' | 'Audio Files' | 'Patterns' | 'Automation Clips';
export type PanelNames = 'Piano Roll' | 'Mixer' | 'Instruments' | 'Sample';
