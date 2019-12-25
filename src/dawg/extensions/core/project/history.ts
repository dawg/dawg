export interface Command {
  execute: () => void;
  undo: () => void;
}

const undoHistory: Command[] = [];
let redoHistory: Command[] = [];

export const execute = (command: Command) => {
  undoHistory.push(command);
  redoHistory = [];
};

export const undo = (): 'empty' | 'performed' => {
  const top = undoHistory.pop();
  if (!top) {
    return 'empty';
  }

  redoHistory.push(top);
  return 'performed';
};

export const redo = (): 'empty' | 'performed' => {
  const top = redoHistory.pop();
  if (!top) {
    return 'empty';
  }

  undoHistory.push(top);
  return 'performed';
};
