import { manager } from '../manager';
import { Wrapper, computed } from 'vue-function-api';

interface API {
  sideBarSize: Wrapper<number>;
  panelsSize: Wrapper<number>;
}

// tslint:disable-next-line:interface-over-type-literal
type Workspace = {
  sideBarSize: number;
  panelsSize: number;
};

export const sizes = manager.activate<Workspace, {}, {}, API>({
  id: 'dawg.sizes',
  activate(context) {
    const sideBarSize = computed(() => {
      return context.workspace.get('sideBarSize', 250);
    }, (value: number) => {
      context.workspace.set('sideBarSize', value);
    });

    const panelsSize = computed(() => {
      return context.workspace.get('panelsSize', 250);
    }, (value: number) => {
      context.workspace.set('panelsSize', value);
    });


    return {
      sideBarSize,
      panelsSize,
    };
  },
});
