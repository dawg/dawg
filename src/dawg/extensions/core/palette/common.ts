import * as events from '@/base/events';

export interface PaletteOptions {
  /**
   * Whether to call the callback when selected using the arrow keys.
   */
  automatic?: boolean;
  placeholder?: string;
}

interface PaletteEvents {
  show: (items: PaletteItem[], opts?: PaletteOptions) => void;
  cancel: () => void;
  select: (text: string) => void;
  focus: (text: string) => void;
}

export const paletteEvents = events.emitter<PaletteEvents>();

export interface PaletteItem {
  text: string;
  action?: string;
}
