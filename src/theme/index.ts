import tinycolor from 'tinycolor2';

const PERCENTAGES = [4, 8, 12, 20, 30];

interface Classes {[k: string]: string; }
type Theme = Classes;

const add = (classes: Classes, name: string, color: string, suffix = '') => {
  classes[`${name}${suffix}`] = `background-color: #${color}!important;`;
  classes[`${name}${suffix}--text`] = `color: #${color}!important;`;
};

function createClasses(theme: Theme) {
  const classes: Classes = {};
  Object.entries(theme).map(([name, color]) => {
    add(classes, name, color);
    return PERCENTAGES.map((percentage, n) => {
      add(classes, name, tinycolor(color).darken(percentage).toHex(), `-darken-${n}`);
      add(classes, name, tinycolor(color).lighten(percentage).toHex(), `-lighten-${n}`);
    });
  });
  return classes;
}

function classesToString(classes: Classes) {
  const css: string[] = [];
  Object.keys(classes).forEach((name) => {
    css.push(
    `.${name} {
      ${classes[name]}
    }
    `);
  });
  return css.join('\n');
}

const THEME: Theme = {
  primary: '1976D2',
  secondary: '21242B',
  accent: '82B1FF',
  error: 'd13b2e',
  info: '007bff',
  success: '2ba143',
  warning: 'ad7c0b',
};

interface Options {
  theme?: Partial<Theme>;
}


const Theme = {
  install(Vue: any, options?: Options) {
    const theme: Theme = JSON.parse(JSON.stringify(THEME));
    if (options && options.theme) {
      Object.entries(options.theme).forEach(([name, color]) => {
        if  (!color) { return; }
        theme[name] = color;
      });
    }

    const node = document.createElement('style');
    const classes = createClasses(THEME);
    node.innerHTML = classesToString(classes);
    document.body.appendChild(node);
  },
};

export default Theme;
