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

const fgColor = {};
const textColor = {};
const backgroundColor = {};
const borderColor = {};
colorNames.forEach((name) => {
  [
    ['', fgColor],
    ['', borderColor],
    ['', backgroundColor],
    ['text-', textColor]
  ].forEach(([prefix, o]) => {
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

borderColor.transparent = {
  default: 'rgba(255, 255, 255, 0)',
};
[10, 20, 30, 40, 50, 60, 70, 80, 90].forEach((opacity) => {
  borderColor.transparent[opacity] = `rgba(255, 255, 255, ${opacity / 100})`;
})

module.exports = {
  theme: {
    extend: { backgroundColor, textColor, borderColor, },
  },
  variants: {
    display: ['responsive', 'group-hover'],
    backgroundColor: ['responsive', 'hover', 'focus', 'active'],
    borderColor: ['responsive', 'hover', 'focus', 'active'],
  },
  plugins: [
    ({ addUtilities }) => {
      const newUtilities = {};
      Object.entries(fgColor).forEach(([name, o]) => {
        Object.keys(o).map((key) => {
          newUtilities['.fg-' + name + (key === 'default' ? '' : `-${key}`)] = {
            color: o[key],
          };
        });
      });

      addUtilities(newUtilities, ['hover'])
    }
  ]
};