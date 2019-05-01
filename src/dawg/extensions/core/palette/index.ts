import { manager } from '@/dawg/extensions/manager';
import { ui } from '@/dawg/ui';
import { Palette } from '@/dawg/extensions/core/palette/palette';

type QuickPickCallback<T> = (item: T) => void;

interface QuickPickOptions<T> {
  placeholder?: string;
  onDidKeyboardFocus?: QuickPickCallback<T>;
  onDidCancel?: QuickPickCallback<T>;
  onDidSelect: QuickPickCallback<T>;
}

export const palette = manager.activate({
  id: 'dawg.palette',
  activate() {
    ui.global.push(Palette);

    return {
      showQuickPick<T>(items: T[] | { [text: string]: T }, options: QuickPickOptions<T>): Promise<void> {
        return new Promise((resolve) => {
          // TODO MOVE TO CORE
          resolve();
        });
      },

      // TODO IMPLEMENT AND MOVE TO CORE
      showInputBox(): Promise<number> {
        return new Promise((resolve) => {
          // TODO MOVE TO CORE
          resolve(0);
        });
      },
    };
  },
  deactivate() {
    ui.global.pop();
  },
});
