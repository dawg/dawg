import { Extension, ExtensionContext, IExtensionContext } from '@/dawg/extensions';

interface ExtensionData {
  resolved: boolean;
  api: ReturnType<Extension['activate']>;
}

const extensions: { [id: string]: ExtensionData } = {};

let extensionsStack: Array<{ extension: Extension, context: IExtensionContext }> = [];

export const manager = {
  activate<E extends Extension<any, any, any, any>>(extension: E): ReturnType<E['activate']> {
    const context = new ExtensionContext();
    const api = extension.activate(context);
    extensionsStack.push({ extension, context });
    return api;
  },
  deactivateAll() {
    // since we are resetting the stack, we can reverse in place
    extensionsStack.reverse().forEach(({ extension, context }) => {
      if (extension.deactivate) {
        extension.deactivate(context);
      }
    });

    extensionsStack = [];
  },
  get<T extends Extension>(extension: T): ReturnType<T['activate']> {
    if (extensions.hasOwnProperty(extension.id)) {
      const { resolved } = extensions[extension.id];
      if (!resolved) {
        throw Error(`Circular dependency detected with ${extension.id}`);
      }
    } else {

      extensions[extension.id] = {
        resolved: false,
        api: manager.activate(extension),
      };
    }

    return extensions[extension.id].api as ReturnType<T['activate']>;
  },
};
