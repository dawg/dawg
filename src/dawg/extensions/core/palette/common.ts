import * as events from '@/base/events';

export interface PaletteOptions {
  placeholder?: string;
}

interface PaletteEvents {
  show: (items: PaletteItem[], opts?: PaletteOptions) => void;
  cancel: () => void;
  select: (text: string) => void;
  focus: (text: string) => void;
  showTextField: (opts?: PaletteOptions) => void;
}

export const paletteEvents = events.emitter<PaletteEvents>();

export interface PaletteItem {
  text: string;
  action?: string;
}
