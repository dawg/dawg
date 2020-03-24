import electron from 'electron';

interface Options {
  showInspectElement?: boolean;
}

const webContents = (win: electron.BrowserWindow) => win.webContents;

const decorateMenuItem = (menuItem: any) => {
  return (options: any = {}) => {
    if (options.transform && !options.click) {
      menuItem.transform = options.transform;
    }

    return menuItem;
  };
};

const removeUnusedMenuItems = (menuTemplate: any[]) => {
  let notDeletedPreviousElement: any;

  return menuTemplate
    .filter((menuItem) => {
      return menuItem !== undefined && menuItem !== false && menuItem.visible !== false;
    })
    .filter((menuItem, index, array) => {
      const toDelete =
        menuItem.type === 'separator' &&
        (!notDeletedPreviousElement || index === array.length - 1 || array[index + 1].type === 'separator');

      notDeletedPreviousElement = toDelete ? notDeletedPreviousElement : menuItem;
      return !toDelete;
    });
};

const create = (win: electron.BrowserWindow, options: Options) => {
  win.webContents.on('context-menu', (_, props: any) => {
    const { editFlags } = props;
    const hasText = props.selectionText.trim().length > 0;
    const isLink = Boolean(props.linkURL);
    const can = (type: any) => editFlags[`can${type}`] && hasText;

    const defaultActions = {
      separator: () => ({type: 'separator'}),
      lookUpSelection: decorateMenuItem({
        id: 'lookUpSelection',
        label: 'Look Up “{selection}”',
        visible: process.platform === 'darwin' && hasText && !isLink,
        click(): any {
          if (process.platform === 'darwin') {
            webContents(win).showDefinitionForSelection();
          }
        },
      }),
      cut: decorateMenuItem({
        id: 'cut',
        label: 'Cut',
        enabled: can('Cut'),
        visible: props.isEditable,
        click(menuItem: any) {
          props.selectionText = menuItem.transform ?
            menuItem.transform(props.selectionText) :
            props.selectionText;
          electron.clipboard.writeText(props.selectionText);
          webContents(win).delete();
        },
      }),
      copy: decorateMenuItem({
        id: 'copy',
        label: 'Copy',
        enabled: can('Copy'),
        visible: props.isEditable || hasText,
        click(menuItem: any) {
          props.selectionText = menuItem.transform ?
            menuItem.transform(props.selectionText) :
            props.selectionText;
          electron.clipboard.writeText(props.selectionText);
        },
      }),
      paste: decorateMenuItem({
        id: 'paste',
        label: 'Paste',
        enabled: editFlags.canPaste,
        visible: props.isEditable,
        click(menuItem: any) {
          let clipboardContent = electron.clipboard.readText(props.selectionText);
          clipboardContent = menuItem.transform ?
            menuItem.transform(clipboardContent) :
            clipboardContent;

          webContents(win).insertText(clipboardContent);
        },
      }),
      copyLink: decorateMenuItem({
        id: 'copyLink',
        label: 'Copy Link',
        visible: props.linkURL.length !== 0 && props.mediaType === 'none',
        click(menuItem: any) {
          props.linkURL = menuItem.transform ? menuItem.transform(props.linkURL) : props.linkURL;

          electron.clipboard.write({
            bookmark: props.linkText,
            text: props.linkURL,
          });
        },
      }),
      inspect: () => ({
        id: 'inspect',
        label: 'Inspect Element',
        click() {
          win.webContents.inspectElement(props.x, props.y);

          if (webContents(win).isDevToolsOpened()) {
            webContents(win).devToolsWebContents.focus();
          }
        },
      }),
      services: () => ({
        id: 'services',
        label: 'Services',
        role: 'services',
        visible: process.platform === 'darwin' && (props.isEditable || hasText),
      }),
    };

    let menuTemplate = [
      defaultActions.separator(),
      defaultActions.separator(),
      defaultActions.cut(),
      defaultActions.copy(),
      defaultActions.paste(),
      defaultActions.separator(),
      defaultActions.separator(),
      defaultActions.copyLink(),
      defaultActions.separator(),
      options.showInspectElement && defaultActions.inspect(),
      defaultActions.separator(),
    ];

    // Filter out leading/trailing separators
    // FIXME: https://github.com/electron/electron/issues/5869
    menuTemplate = removeUnusedMenuItems(menuTemplate);

    if (menuTemplate.length > 0) {
      const menu = (
        electron.remote ? electron.remote.Menu : electron.Menu
      ).buildFromTemplate(menuTemplate);

      /*
			When `electron.remote`` is not available this runs in the browser process.
			We can safely use `win`` in this case as it refers to the window the
			context-menu should open in.
			When this is being called from a webView, we can't use win as this
			would refere to the webView which is not allowed to render a popup menu.
      */
      menu.popup();
    }
  });
};

export default (options: Options = {}) => {
  for (const win of (electron.BrowserWindow || electron.remote.BrowserWindow).getAllWindows()) {
    create(win, options);
  }

  (electron.app || electron.remote.app).on('browser-window-created', (event, win) => {
    create(win, options);
  });
};
