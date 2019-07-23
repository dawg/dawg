import { VueConstructor, CreateElement } from 'vue';
import { Drag, Drop } from 'vue-drag-drop';
import { Prop, Component, Vue } from 'vue-property-decorator';
import { createHOC } from '@/utils';

let dragging: string | null = null;

export const accepting = (component: VueConstructor) => {
  @Component
  class Accepting extends Vue {
    @Prop({ type: String, required: true }) public group!: string;

    public drop(data: any, e: MouseEvent) {
      if (this.group === dragging) {
        this.$emit('drop', data, e);
      }
    }

    public handleDragover(_: any, e: DragEvent) {
      if (!e.dataTransfer) {
        return;
      }

      if (this.group === dragging) {
        // We need to stop immediate propagation
        // If there is a no drop zone inside a drop zone, the no drop zone will overwrite the drop
        // if we don't stop propagation
        e.stopPropagation();

        e.dataTransfer.dropEffect = 'copy';
      } else {
        e.dataTransfer.dropEffect = 'none';
      }
    }

    public render(createElement: CreateElement) {
      return createHOC(component, createElement, this, {
        on: {
          drop: this.drop,
          dragover: this.handleDragover,
        },
      });
    }
  }

  return Accepting;
};

export const giving = (component: VueConstructor) => {
  @Component
  class Giving extends Vue {
    @Prop({ type: String, required: true }) public group!: string;

    public dragstart() {
      dragging = this.group;
    }

    public dragend() {
      dragging = null;
    }

    public render(createElement: CreateElement) {
      return createHOC(component, createElement, this, {
        on: {
          dragstart: this.dragstart,
          dragend: this.dragend,
        },
      });
    }
  }

  return Giving;
};

export default {
  install() {
    Vue.component('drag', giving(Drag));
    Vue.component('drop', accepting(Drop));
  },
};
