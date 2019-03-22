import Vue from 'vue';
import { Theme, Classes } from '@/modules/theme/types';
import tinycolor from 'tinycolor2';
import { defaults } from './defaults';
import Component from 'vue-class-component';

export interface ThemeAugmentation {
  $theme: Theme;
}

@Component
class Bus extends Vue implements Theme {
  public foreground = '';
  public background = '';
  public primary = '';
  public secondary = '';
  public accent = '';
  public error = '';
  public info = '';
  public success = '';
  public warning = '';
}

const bus = new Bus();

const PERCENTAGES = [2, 4, 8, 12, 20, 32];

const add = (classes: Classes, name: string, color: string, suffix = '') => {
  classes[`${name}${suffix}`] = `background-color: #${color}!important;`;
  classes[`${name}${suffix}--text`] = `color: #${color}!important;`;
  classes[`${name}${suffix}--stroke`] = `stroke: #${color}!important;`;
  classes[`${name}${suffix}--fill`] = `fill: #${color}!important;`;
};

function createClasses(theme: Theme) {
  const classes: Classes = {};
  Object.entries(theme).forEach(([name, color]) => {
    add(classes, name, color);
    return PERCENTAGES.forEach((percentage, n) => {
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

let style: Node | null = null;
const v: any = null;

export function insertTheme(theme: Theme) {
  if (style) {
    document.body.removeChild(style);
    style = null;
  }

  const hex: { [k: string]: string } = {};
  Object.keys(theme).forEach((key) => {
    hex[key] = `#${theme[key as keyof Theme]}`;
  });

  const variables = Object.entries(theme).map(([name, color]) => {
    return `--${name}: #${color};`;
  });

  const node = document.createElement('style');
  const classes = createClasses(theme);
  let css = classesToString(classes);
  css += '\n';
  css += `
body {
  ${variables.join('  \n')}
}
  `;

  node.innerHTML = css;
  style = document.body.appendChild(node);

  bus.foreground = hex.foreground;
  bus.background = hex.background;
  bus.primary = hex.primary;
  bus.secondary = hex.secondary;
  bus.accent = hex.accent;
  bus.error = hex.error;
  bus.info = hex.info;
  bus.success = hex.success;
  bus.warning = hex.warning;
}


const Theme = {
  install(vue: any) {
    vue.prototype.$theme = bus;
    insertTheme(defaults.Default);
  },
  insertTheme,
  defaults,
};

export default Theme;
