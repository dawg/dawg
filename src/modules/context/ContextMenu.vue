<template>
  <v-menu
    class="menu"
    transition="slide-x-transition"
    bottom
    right
    v-model="open"
    :position-x="x"
    :position-y="y"
    :z-index="100"
    :min-width="250"
  >
    <div class="items secondary-lighten-2 white--text">
      <div
        v-for="(item, i) in items"
        :key="i"
        @click="item.callback"
        class="item"
        :class="{ primary: active[i] }"
        @mouseover="mouseover(i)"
        @mouseleave="mouseleave(i)"
      >
        {{ item.text }}
      </div>
    </div>
  </v-menu>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';

import bus, { Item } from './bus';
import { Watch } from '@/modules/update';

@Component
export default class ContextMenu extends Vue {
  public items: Item[] = [];
  public open = false;
  public x = 0;
  public y = 0;
  public active: boolean[] = [];

  public mounted() {
    bus.$on('show', this.show);
  }

  public mouseover(i: number) {
    Vue.set(this.active, i, true);
  }

  public mouseleave(i: number) {
    Vue.set(this.active, i, false);
  }

  public show(payload: { e: MouseEvent, items: Item[] }) {
    this.open = true;
    this.x = payload.e.pageX;
    this.y = payload.e.pageY;
    this.items = payload.items;
  }

  @Watch<ContextMenu>('open')
  public onClose() {
    if (this.open) { return; }
    this.active = [];
  }
}
</script>

<style lang="sass" scoped>
.item
  height: 24px
  line-height: 24px
  vertical-align: center
  padding: 0 16px
  text-align: left

  &:hover
    cursor: pointer

.items
  padding: 5px 0

.menu
  position: absolute
  left: 0
  top: 0
</style>