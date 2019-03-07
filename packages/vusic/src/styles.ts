import tinycolor from 'tinycolor2';

const THEME: {[k: string]: string} = {
  primary: '1976D2',
  secondary: '21242B',
  accent: '82B1FF',
  error: 'd13b2e',
  info: '007bff',
  success: '2ba143',
  warning: 'ad7c0b',
};


const PERCENTAGES = [4, 8, 12, 20];

interface Classes {[k: string]: string; }

const add = (name: string, color: string, suffix = '') => {
  classes[`${name}${suffix}`] = `background-color: #${color}!important;`;
  classes[`${name}${suffix}--text`] = `color: #${color}!important;`;
};

const classes: Classes = {};
Object.keys(THEME).map((name) => {
  add(name, THEME[name]);
  return [1, 2, 3, 4].map((n) => {
    add(name, tinycolor(THEME[name]).darken(PERCENTAGES[n]).toHex(), `-darken-${n}`);
    add(name, tinycolor(THEME[name]).lighten(PERCENTAGES[n]).toHex(), `-lighten-${n}`);
  });
});

const css: string[] = [];
Object.keys(classes).forEach((name) => {
  css.push(
`.${name} {
  ${classes[name]}
}
`);
});


export default css.join('\n');
