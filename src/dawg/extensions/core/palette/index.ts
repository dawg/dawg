import { manager } from '@/dawg/extensions/manager';
import { ui } from '@/dawg/ui';
import { Palette, paletteEvents, DetailedItem } from '@/dawg/extensions/core/palette/palette';

type QuickPickCallback<T> = (item: T) => void;

interface InputItemLookup<T> { [key: string]: T; }

interface QuickPickOptions<T> {
  onDidCancel?: () => void;
  onDidSelect: QuickPickCallback<T>;
  onDidKeyboardFocus?: QuickPickCallback<T>;
  placeholder?: string;
}

export const palette = manager.activate({
  id: 'dawg.palette',
  activate() {
    ui.global.push(Palette);

    return {
      selectFromStrings<T extends string>(items: T[], options: QuickPickOptions<T>) {
        this.selectFromTuples(items.map((item) => [{ text: item }, item]), options);
      },
      selectFromItems<T extends DetailedItem>(items: T[], options: QuickPickOptions<T>) {
        this.selectFromTuples(items.map((item) => [item, item]), options);
      },
      selectFromTuples<T>(items: Array<[DetailedItem, T]>, options: QuickPickOptions<T>) {
        const lookup: InputItemLookup<T> = {};
        items.forEach(([info, item]) => {
          lookup[info.text] = item;
        });

        const paletteItems = items.map(([info, _]) => info);

        paletteEvents.emit('show', paletteItems, {
          placeholder: options.placeholder,
        });

        const onDidSelect = (key: string) => {
          const item = lookup[key];
          options.onDidSelect(item);
          removeListeners();
        };

        const onDidFocus = (key: string) => {
          if (options.onDidKeyboardFocus) {
            const item = lookup[key];
            options.onDidKeyboardFocus(item);
          }
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
          paletteEvents.removeListener('focus', onDidFocus);
        };

        paletteEvents.on('select', onDidSelect);
        paletteEvents.on('cancel', onDidCancel);
        paletteEvents.on('focus', onDidFocus);
      },
      selectFromObject<T>(items: InputItemLookup<T>, options: QuickPickOptions<T>) {
        this.selectFromTuples(Object.keys(items).map((key) => [{ text: key }, items[key]]), options);
      },
      async showNumberInputBox() {
        //
        return 0;
      },
    };
  },
  deactivate() {
    ui.global.pop();
  },
});
