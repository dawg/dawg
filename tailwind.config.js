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

const colors = {};
colorNames.forEach((name) => {
  ['bg', 'text'].forEach((prefix) => {
    colors[name] = {
      'lighten-1': `var(--color-${prefix}-${name}-lighten-1)`,
      'lighten-2': `var(--color-${prefix}-${name}-lighten-2)`,
      'lighten-3': `var(--color-${prefix}-${name}-lighten-3)`,
      'lighten-4': `var(--color-${prefix}-${name}-lighten-4)`,
      'lighten-5': `var(--color-${prefix}-${name}-lighten-5)`,
      'lighten-5': `var(--color-${prefix}-${name}-lighten-6)`,
      'default': `var(--color-${prefix}-${name}-default)`,
      'darken-1': `var(--color-${prefix}-${name}-darken-1)`,
      'darken-2': `var(--color-${prefix}-${name}-darken-2)`,
      'darken-3': `var(--color-${prefix}-${name}-darken-3)`,
      'darken-4': `var(--color-${prefix}-${name}-darken-4)`,
      'darken-5': `var(--color-${prefix}-${name}-darken-5)`,
      'darken-5': `var(--color-${prefix}-${name}-darken-6)`,
    };
  })
})

module.exports = {
  theme: {
    extend: { colors },
  },
  variants: {},
  plugins: []
};