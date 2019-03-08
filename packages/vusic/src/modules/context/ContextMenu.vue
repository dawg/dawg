<template>
  <v-menu
    class="menu"
    transition="slide-x-transition"
    bottom
    right
    v-model="open"
    :position-x="x"
    :position-y="y"
    :close-on-click="false"
    :z-index="100"
    :min-width="250"
  >
    <div class="items secondary-lighten-2 white--text">
      <template v-for="(item, i) in items">
        <div
          v-if="item"
          :key="i"
          @click="item.callback(e)"
          class="item"
          :class="{ primary: active[i] }"
          @mouseover="mouseover(i)"
          @mouseleave="mouseleave(i)"
        >
          {{ item.text }}
        </div>
        <div v-else :key="i" class="break"></div>
      </template>
    </div>
  </v-menu>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';

import bus, { Item, isMouseEvent, Position } from '@/modules/context/bus';
import { Watch } from '@/modules/update';

@Component
export default class ContextMenu extends Vue {
  public items: Array<Item | null> = [];
  public open = false;
  public x = 0;
  public y = 0;
  public active: boolean[] = [];
  public e?: MouseEvent = undefined;

  public mounted() {
    bus.$on('show', this.show);
  }

  public destroyed() {
    // Make sure to remove all stray listeners
    bus.$off('show', this.show);
    document.removeEventListener('click', this.outsideClickListener);
  }

  public outsideClickListener(event: MouseEvent) {
    if (!event.target) {
      return;
    }

    if (!this.$el.contains(event.target as Node)) {
      this.open = false;
      document.removeEventListener('click', this.outsideClickListener);
    }
  }

  public mouseover(i: number) {
    Vue.set(this.active, i, true);
  }

  public mouseleave(i: number) {
    Vue.set(this.active, i, false);
  }

  public show(payload: { e: MouseEvent | Position, items: Array<Item | null> }) {
    this.open = true;
    if (isMouseEvent(payload.e)) {
      this.e = payload.e;
      this.x = payload.e.pageX;
      this.y = payload.e.pageY;
    } else {
      this.x = payload.e.left;
      this.y = payload.e.bottom;
    }

    this.items = payload.items;

    document.addEventListener('click', this.outsideClickListener);
  }

  @Watch<ContextMenu>('open')
  public onClose() {
    if (this.open) { return; }
    this.active = [];
    this.e = undefined;
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

.break
  width: 100%
  border-top: 1px solid #484848
  margin: 5px 0
</style>