const colorNames = [
  'primary',
  'secondary',
  'default',
  'inverse',
  'error',
  'info',
  'success',
  'warning',
];

const textColor = {};
const backgroundColor = {};
const borderColor = {};
colorNames.forEach((name) => {
  [['', borderColor], ['', backgroundColor], ['text-', textColor]].forEach(([prefix, o]) => {
    o[name] = {
      'lighten-1': `var(--${prefix}${name}-lighten-1)`,
      'lighten-2': `var(--${prefix}${name}-lighten-2)`,
      'lighten-3': `var(--${prefix}${name}-lighten-3)`,
      'lighten-4': `var(--${prefix}${name}-lighten-4)`,
      'lighten-5': `var(--${prefix}${name}-lighten-5)`,
      'default': `var(--${prefix}${name})`,
      'darken-1': `var(--${prefix}${name}-darken-1)`,
      'darken-2': `var(--${prefix}${name}-darken-2)`,
      'darken-3': `var(--${prefix}${name}-darken-3)`,
      'darken-4': `var(--${prefix}${name}-darken-4)`,
      'darken-5': `var(--${prefix}${name}-darken-5)`,
    };
  });
});

module.exports = {
  theme: {
    extend: { backgroundColor, textColor, borderColor, },
  },
  variants: {},
  plugins: []
};