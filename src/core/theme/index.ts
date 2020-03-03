import { createExtension } from '@/lib/framework/extensions';
import { Classes } from '@/core/theme/types';
import { defaults } from '@/core/theme/defaults';
import tinycolor from 'tinycolor2';
import { palette } from '@/core/palette';
import { commands } from '@/core/commands';
import * as framework from '@/lib/framework';
import * as t from '@/lib/io';
import { keys } from '@/lib/std';

export interface ThemeAugmentation {
  $theme: framework.Theme;
}

const PERCENTAGES = [2, 4, 8, 12, 20, 32];

function createVariables(newTheme: framework.Theme) {
  const variables: Classes = {};
  Object.entries(newTheme).forEach(([name, color]) => {
    variables[name] = color;
    return PERCENTAGES.forEach((percentage, n) => {
      variables[name + `-darken-${n}`] = tinycolor(color).darken(percentage).toHex();
      variables[name + `-lighten-${n}`] = tinycolor(color).lighten(percentage).toHex();
    });
  });
  return variables;
}

export function createCss(name: ThemeNames) {
  const newTheme = defaults[name];
  const variables = createVariables(newTheme);
  const variablesList = Object.entries(variables).map(([varName, varColor]) => {
    return `  --${varName}: #${varColor};`;
  });

  let css = `
.${name} {
${variablesList.join('\n')}
}
  `;
  css += '\n';

  return css;
}

let style: Node | null = null;
const insertThemes = () => {
  if (style) {
    document.body.removeChild(style);
    style = null;
  }

  const themeNames = Object.keys(defaults) as ThemeNames[];
  const css = themeNames.map(createCss).join('\n\n');
  const node = document.createElement('style');
  node.innerHTML = css;
  style = document.body.appendChild(node);
};

let oldTheme: ThemeNames;
const insertTheme = (name: ThemeNames) => {
  // make a `dispose` call
  if (oldTheme) {
    framework.ui.rootClasses.splice(framework.ui.rootClasses.indexOf(oldTheme));
  }

  framework.ui.rootClasses.push(name);
  oldTheme = name;

  const themeObject = defaults[name];
  keys(themeObject).forEach((key) => {
    theme.o[key] = framework.theme[key] = themeObject[key];
  });
};

// https://github.com/Microsoft/vscode/blob/master/src/vs/vscode.d.ts
// https://code.visualstudio.com/api/references/contribution-points#contributes.configuration
// https://github.com/Microsoft/vscode-extension-samples/blob/master/helloworld-sample/src/extension.ts

type ThemeNames = keyof typeof defaults;

const extension = createExtension({
  id: 'dawg.theme',
  workspace: {
    theme: t.string,
  },
  activate(context) {

    const themeNames = Object.keys(defaults) as ThemeNames[];
    const checkIsValidTheme = (candidate: string | undefined): ThemeNames => {
      if (candidate === undefined) {
        return 'default';
      }

      if (themeNames.indexOf(candidate as ThemeNames) === -1) {
        return 'default';
      }

      return candidate as ThemeNames;
    };

    insertThemes();

    const disposable = commands.registerCommand({
      text: 'Change Theme',
      callback: () => {
        const currentThemeName = context.workspace.theme.value;
        palette.selectFromStrings(themeNames, {
          onDidInput: (themeName) => {
            context.workspace.theme.value = themeName;
            insertTheme(themeName);
          },
          onDidKeyboardFocus: (themeName) => {
            insertTheme(themeName);
          },
          onDidCancel: () => {
            insertTheme(checkIsValidTheme(currentThemeName));
          },
        });
      },
    });

    context.subscriptions.push(disposable);

    function insertStoredTheme() {
      const name = context.workspace.theme.value;
      insertTheme(checkIsValidTheme(name));
    }

    return {
      insertStoredTheme,
      darken: (hex: string, amount: 1 | 2 | 3 | 4 | 5) => {
        return tinycolor(hex).darken(PERCENTAGES[amount - 1]).toHexString();
      },
      lighten: (hex: string, amount: 1 | 2 | 3 | 4 | 5) => {
        return tinycolor(hex).lighten(PERCENTAGES[amount - 1]).toHexString();
      },
      o: framework.theme,
    };
  },
});


export const theme = framework.manager.activate(extension);

// Insert the theme right away
// FIXME maybe add ready hook??
theme.insertStoredTheme();
