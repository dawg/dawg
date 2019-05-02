import { manager } from '@/dawg/extensions/manager';
import { ui } from '@/dawg/ui';
import { Palette, paletteEvents, PaletteOptions } from '@/dawg/extensions/core/palette/palette';

type QuickPickCallback<T> = (item: T) => void;

interface DetailedItem { text: string; action?: string; }
type InputItem = string | DetailedItem;
interface InputItemLookup<T> { [key: string]: T; }

interface QuickPickOptions<T> extends PaletteOptions {
  onDidCancel?: () => void;
  onDidSelect: QuickPickCallback<T>;
}

const isDetailedItem = (item: any): item is DetailedItem => {
  return item.hasOwnProperty('text');
};

export const palette = manager.activate({
  id: 'dawg.palette',
  activate() {
    ui.global.push(Palette);

    // TODO(jacob) REMOVE the promise
    return {
      showQuickPick<T extends InputItem>(
        items: T[] | InputItemLookup<T>,
        options: QuickPickOptions<T>,
      ): Promise<void> {
        return new Promise((resolve) => {
          const itemLookup: InputItemLookup<T> = {};

          if (Array.isArray(items)) {
            items.forEach((item) => {
              if (typeof item === 'string') {
                itemLookup[item] = item;
              } else if (isDetailedItem(item)) {
                // This second if statement is annoying but TypeScript doesn't support type narrowing with Generics
                itemLookup[item.text] = item;
              }
            });
          }

          const paletteItems = Object.keys(itemLookup).map((displayText) => {
            const item = itemLookup[displayText];
            // It's super annoying that we have to cast but we do
            return typeof item === 'string' ? { text: displayText } : item as DetailedItem;
          });

          paletteEvents.emit('show', paletteItems, options);

          const onDidSelect = (key: string) => {
            const item = itemLookup[key];
            options.onDidSelect(item);
            removeListeners();
          };

          const onDidCancel = () => {
            if (options.onDidCancel) {
              options.onDidCancel();
            }
            removeListeners();
          };

          const removeListeners = () => {
            paletteEvents.removeListener('select', onDidSelect);
            paletteEvents.removeListener('cancel', onDidCancel);
          };

          paletteEvents.on('select', onDidSelect);
          paletteEvents.on('cancel', onDidCancel);

          resolve();
        });
      },

      // TODO IMPLEMENT AND MOVE TO CORE
      showInputBox(): Promise <number> {
        return new Promise((resolve) => {
          resolve(0);
        });
      },
    };
  },
  deactivate() {
    ui.global.pop();
  },
});
