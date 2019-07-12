import { Extension } from '@/dawg/extensions';
import { Theme, Classes } from '@/dawg/extensions/core/theme/types';
import { defaults } from '@/dawg/extensions/core/theme/defaults';
import tinycolor from 'tinycolor2';
import { palette } from '@/dawg/extensions/core/palette';
import { commands } from '@/dawg/extensions/core/commands';
import { manager } from '@/dawg/extensions/manager';

export interface ThemeAugmentation {
  $theme: Theme;
}

const PERCENTAGES = [2, 4, 8, 12, 20, 32];

const add = (classes: Classes, name: string, color: string, suffix = '') => {
  classes[`${name}${suffix}`] = `background-color: #${color}!important;`;
  classes[`${name}${suffix}--text`] = `color: #${color}!important;`;
  classes[`${name}${suffix}--stroke`] = `stroke: #${color}!important;`;
  classes[`${name}${suffix}--fill`] = `fill: #${color}!important;`;
};

function createClasses(newTheme: Theme) {
  const classes: Classes = {};
  Object.entries(newTheme).forEach(([name, color]) => {
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

export function insertTheme(newTheme: Theme) {
  if (style) {
    document.body.removeChild(style);
    style = null;
  }

  const hex: { [k: string]: string } = {};
  Object.keys(newTheme).forEach((key) => {
    hex[key] = `#${newTheme[key as keyof Theme]}`;
  });

  const variables = Object.entries(newTheme).map(([name, color]) => {
    return `--${name}: #${color};`;
  });

  const node = document.createElement('style');
  const classes = createClasses(newTheme);
  let css = classesToString(classes);
  css += '\n';
  css += `
body {
  ${variables.join('  \n')}
}
  `;

  node.innerHTML = css;
  style = document.body.appendChild(node);

  theme.foreground = hex.foreground;
  theme.background = hex.background;
  theme.primary = hex.primary;
  theme.secondary = hex.secondary;
  theme.accent = hex.accent;
  theme.error = hex.error;
  theme.info = hex.info;
  theme.success = hex.success;
  theme.warning = hex.warning;
}

// https://github.com/Microsoft/vscode/blob/master/src/vs/vscode.d.ts
// https://code.visualstudio.com/api/references/contribution-points#contributes.configuration
// https://github.com/Microsoft/vscode-extension-samples/blob/master/helloworld-sample/src/extension.ts

type ThemeNames = keyof typeof defaults;

interface ITheme {
  foreground: string;
  background: string;
  primary: string;
  secondary: string;
  accent: string;
  error: string;
  info: string;
  success: string;
  warning: string;
  insertStoredTheme: () => void;
}

const extension: Extension<{ theme: ThemeNames }, {}, ITheme> = {
  id: 'dawg.theme',
  activate(context) {
    const disposable = commands.registerCommand({
      text: 'Change Theme',
      callback: () => {
        // this is an annoying cast
        const themeNames = Object.keys(defaults) as ThemeNames[];

        const currentThemeName = context.workspace.get('theme', 'Default');
        palette.selectFromStrings(themeNames, {
          onDidSelect: (themeName) => {
            context.workspace.set('theme', themeName);
            insertTheme(defaults[themeName]);
          },
          onDidKeyboardFocus: (themeName) => {
            insertTheme(defaults[themeName]);
          },
          onDidCancel: () => {
            insertTheme(defaults[currentThemeName]);
          },
        });
      },
    });

    context.subscriptions.push(disposable);

    return {
      foreground: '',
      background: '',
      primary: '',
      secondary: '',
      accent: '',
      error: '',
      info: '',
      success: '',
      warning: '',
      insertStoredTheme: () => {
        const name = context.workspace.get('theme', 'Default');
        // TODO ERROR handling
        insertTheme(defaults[name]);
      },
    };
  },
};


export const theme = manager.activate(extension);

// TODO(jacob) not the best
theme.insertStoredTheme();
