import { peek } from '@/lib/std';
import { emitter } from '@/lib/events';

const events = emitter<{ unsavedChange: [boolean] }>();

export interface Command {
  execute: () => void;
  undo: () => void;
}

const undoHistory: Command[] = [];
let redoHistory: Command[] = [];

interface Context {
  reference: Command | undefined;
  top: Command | undefined;
}

let reference: Command | undefined;
let top: Command | undefined;
let hasUnsavedChanged = false;

const checkHasUnsavedChanges = () => {
  if ((reference !== top) === hasUnsavedChanged) {
    return;
  }

  hasUnsavedChanged = reference !== top;
  events.emit('unsavedChange', hasUnsavedChanged);
};

export const onDidHasUnsavedChangesChange = (cb: (hasUnsavedChanged: boolean) => void) => {
  return events.on('unsavedChange', cb);
};

export const execute = (command: Command) => {
  command.execute();
  undoHistory.push(command);
  top = command;
  checkHasUnsavedChanges();
  redoHistory = [];
};

export const undo = (): 'empty' | 'performed' => {
  const undoTop = undoHistory.pop();
  if (!undoTop) {
    return 'empty';
  }

  undoTop.undo();
  redoHistory.push(undoTop);
  top = peek(undoHistory);
  checkHasUnsavedChanges();

  return 'performed';
};

export const redo = (): 'empty' | 'performed' => {
  const redoTop = redoHistory.pop();
  if (!redoTop) {
    return 'empty';
  }

  redoTop.execute();
  undoHistory.push(redoTop);
  top = redoTop;
  checkHasUnsavedChanges();

  return 'performed';
};

export const freezeReference = () => {
  reference = peek(undoHistory);
  checkHasUnsavedChanges();
};
