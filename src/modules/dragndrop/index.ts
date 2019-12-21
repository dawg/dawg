import { Drag, Drop } from 'vue-drag-drop';
import Vue from 'vue';

let dragging: string | null = null;

const DropWithGroup = Vue.extend({
  components: { Drop },
  template: `
  <drop
    @drop="drop"
    @dragover="dragover"
    v-bind="$attrs"
    v-on="$listeners"
  ><slot></slot></drop>
  `,
  props: { group: { type: String, required: true } },
  methods: {
    drop(data: any, e: MouseEvent) {
      if (this.group === dragging) {
        this.$emit('drop', data, e);
      }
    },
    dragover(_: any, e: DragEvent) {
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
    },
  },
});

const DragWithGroup = Vue.extend({
  components: { Drag },
  template: `
  <drag
    @dragstart="dragstart"
    @dragend="dragend"
    v-bind="$attrs"
    v-on="$listeners"
  ><slot></slot></drag>
  `,
  props: { group: { type: String, required: true } },
  methods: {
    dragstart() {
      dragging = this.group;
    },
    dragend() {
      dragging = null;
    },
  },
});


export default {
  install() {
    Vue.component('Drag', DragWithGroup);
    Vue.component('drop', DropWithGroup);
  },
};
