import { Component, Vue } from 'vue-property-decorator';
import { CreateElement, VNode } from 'vue';
import { Bus } from '@/modules/update';

type Arg = string | { text: string, value: string };
const bus = new Bus<{ update: [Arg], clear: [] }>();

@Component
class StatusText extends Vue {
  public status = '';
  public value: string | null = null;

  public mounted() {
    bus.$on('update', this.update);
    bus.$on('clear', this.clear);
  }

  public destroyed() {
    bus.$off('update', this.update);
    bus.$off('clear', this.clear);
  }

  public update(status: Arg) {
    // @ts-ignore
    status = status[0];
    if (typeof status === 'object') {
      this.status = status.text;
      this.value = status.value;
    } else {
      this.status = status;
    }
  }

  public clear() {
    this.status = '';
    this.value = null;
  }

  public render(h: CreateElement) {
    let element: VNode;
    if (this.value !== null) {
        element = h('div', [
          h('span', this.status),
          h('span', { style: { margin: '0 5px' } }, '|'),
          h('span', this.value),
        ]);
    } else {
      element = h('span', this.status);
    }

    return element;
  }
}

export interface StatusAugmentation {
  $status: {
    set: (status: Arg) => void;
    clear: () => void;
  };
}

export default {
  install(vue: any) {
    vue.component('StatusText', StatusText);

    vue.prototype.$status = {
      set: (status: Arg) => {
        bus.$emit('update', status);
      },
      clear: () => {
        bus.$emit('clear');
      },
    };
  },
};
