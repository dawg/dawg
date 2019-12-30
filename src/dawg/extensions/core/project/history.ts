export interface Command {
  execute: () => void;
  undo: () => void;
}

const undoHistory: Command[] = [];
let redoHistory: Command[] = [];

export const execute = (command: Command) => {
  command.execute();
  undoHistory.push(command);
  redoHistory = [];
};

export const undo = (): 'empty' | 'performed' => {
  const top = undoHistory.pop();
  if (!top) {
    return 'empty';
  }

  top.undo();
  redoHistory.push(top);
  return 'performed';
};

export const redo = (): 'empty' | 'performed' => {
  const top = redoHistory.pop();
  if (!top) {
    return 'empty';
  }

  top.execute();
  undoHistory.push(top);
  return 'performed';
};
