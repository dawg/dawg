import { manager } from '@/base/manager';
import { ui } from '@/base/ui';
import { paletteEvents, PaletteItem } from '@/dawg/extensions/core/palette/common';
export {
  PaletteItem,
};
import Palette from '@/dawg/extensions/core/palette/Palette.vue';


type QuickPickCallback<T> = (item: T) => void;

interface InputItemLookup<T> { [key: string]: T; }

interface InputOptions<T> {
  onDidCancel?: () => void;
  onDidInput: QuickPickCallback<T>;
  onDidKeyboardFocus?: QuickPickCallback<T>;
  placeholder?: string;
}

export const palette = manager.activate({
  id: 'dawg.palette',
  activate() {
    ui.global.push(Palette);

    return {
      selectFromStrings<T extends string>(items: T[], options: InputOptions<T>) {
        this.selectFromTuples(items.map((item) => [{ text: item }, item]), options);
      },
      selectFromItems<T extends PaletteItem>(items: T[], options: InputOptions<T>) {
        this.selectFromTuples(items.map((item) => [item, item]), options);
      },
      selectFromTuples<T>(items: Array<[PaletteItem, T]>, options: InputOptions<T>) {
        const lookup: InputItemLookup<T> = {};
        items.forEach(([info, item]) => {
          lookup[info.text] = item;
        });

        const paletteItems = items.map(([info, _]) => info);

        paletteEvents.emit('show', paletteItems, {
          placeholder: options.placeholder,
        });

        const onDidInput = (key: string) => {
          const item = lookup[key];
          options.onDidInput(item);
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
          paletteEvents.removeListener('select', onDidInput);
          paletteEvents.removeListener('cancel', onDidCancel);
          paletteEvents.removeListener('focus', onDidFocus);
        };

        paletteEvents.on('select', onDidInput);
        paletteEvents.on('cancel', onDidCancel);
        paletteEvents.on('focus', onDidFocus);
      },
      selectFromObject<T>(items: InputItemLookup<T>, options: InputOptions<T>) {
        this.selectFromTuples(Object.keys(items).map((key) => [{ text: key }, items[key]]), options);
      },
      async showNumberInputBox() {
        //
        return 0;
      },
      async showInputBox(options: Omit<InputOptions<string>, 'onDidKeyboardFocus'>) {
        paletteEvents.emit('showTextField', {
          placeholder: options.placeholder,
        });

        const onDidInput = (value: string) => {
          options.onDidInput(value);
          removeListeners();
        };

        const onDidCancel = () => {
          if (options.onDidCancel) {
            options.onDidCancel();
          }
          removeListeners();
        };

        const removeListeners = () => {
          paletteEvents.removeListener('select', onDidInput);
          paletteEvents.removeListener('cancel', onDidCancel);
        };

        paletteEvents.on('select', onDidInput);
        paletteEvents.on('cancel', onDidCancel);
      },
    };
  },
  deactivate() {
    ui.global.pop();
  },
});
