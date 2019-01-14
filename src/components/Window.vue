<template>
  <vue-dra;;ggable-resizable
 ; ;    v-show="isOpen"
      :drag-handle="'.toolbar'"
      :x="200"
      :y="200"
      :h="content.height"
      :w="content.width"
      @resizing="onResizing">
    <div class="toolbar" :style="toolbarStyle">
      <slot name="toolbar"/>
      <v-spacer></v-spacer>
      <v-btn icon>
        <v-icon>remove</v-icon>
      </v-btn>
      <v-btn @click="isOpen = false" icon>
        <v-icon>close</v-icon>
      </v-btn>
    </div>

    <div :style="contentStyle">
      <slot/>
    </div>
  </vue-draggable-resizable>
</template>

<script>
import VueDraggableResizable from 'vue-draggable-resizable';
import { vmodel, px } from '@/mixins';

export default {
  name: 'Window',
  components: { VueDraggableResizable },
  mixins: [vmodel, px],
  data() {
    return {
      isOpen: true,
      toolbar: 62,
    };
  },
  methods: {
    onResizing(left, top, width, height) {
      this.content.height = height;
      this.content.width = width;
      this.input({ height, width });
    },
  },
  computed: {
    toolbarStyle() {
      return {
        width: this.px(this.content.width),
        height: this.px(this.toolbar),
      };
    },
    contentStyle() {
      return {
        width: this.px(this.content.width),
        height: this.px(this.content.height - this.toolbar),
        overflow: 'hidden',
      };
    },
  },
};
</script>

<style scoped>
  .toolbar {
    display: flex;
    flex-flow: row nowrap;
    border-radius: 4pt 4pt 0 0;
    padding: .5em;
    flex: 0 0 auto;
  }
</style>
