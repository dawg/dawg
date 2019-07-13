import * as t from 'io-ts';
import { manager } from '../manager';

export const sizes = manager.activate({
  id: 'dawg.sizes',
  workspace: {
    sideBarSize: t.number,
    panelsSize: t.number,
  },
  activate(context) {
    return {
      sideBarSize: context.workspace.sideBarSize,
      panelsSize: context.workspace.panelsSize,
    };
  },
});
