export const dropEffects = {
  copy: 'copy',
  move: 'move',
  link: 'link',
  none: 'none',
};

export type DropEffect = keyof typeof dropEffects;

export const effectsAllowed = {
  none: 'none',
  copy: 'copy',
  copyLink: 'copyLink',
  copyMove: 'copyMove',
  link: 'link',
  linkMove: 'linkMove',
  move: 'move',
  all: 'all',
  uninitialized: 'uninitialized',
};

export type AllowedEffect = keyof typeof effectsAllowed;
