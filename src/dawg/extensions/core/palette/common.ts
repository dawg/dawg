import * as events from '@/events';

export interface PaletteOptions {
  placeholder?: string;
}

// tslint:disable-next-line:interface-over-type-literal
type PaletteEvents = {
  show: [PaletteItem[], PaletteOptions | undefined];
  cancel: [];
  select: [string];
  focus: [string];
  showTextField: [PaletteOptions | undefined];
};

export const paletteEvents = events.emitter<PaletteEvents>();

export interface PaletteItem {
  text: string;
  action?: string;
}
