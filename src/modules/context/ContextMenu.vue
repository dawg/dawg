<template>
  <div v-if="open" class="menu" :style="style">
    <div class="items secondary-lighten-2 foreground--text">
      <template v-for="(item, i) in processed">
        <div
          v-if="item"
          :key="i"
          @click="doCallback(item.callback)"
          class="item"
          style="display: flex"
          :class="{ primary: active[i] }"
          @mouseover="mouseover(i)"
          @mouseleave="mouseleave(i)"
        >
          <div>{{ item.text }}</div>
          <div style="flex: 1"></div>
          <div class="shortcut">{{ item.shortcut }}</div>
        </div>
        <div v-else :key="i" class="break"></div>
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';

import bus, { Item, isMouseEvent, Position, ContextPayload } from '@/modules/context/bus';
import { Watch } from '@/modules/update';

@Component
export default class ContextMenu extends Vue {
  /**
   * The default width of the menu.
   */
  @Prop({ type: Number, default: 300 }) public width!: number;

  public items: Array<Item | null> = [];
  public open = false;
  public x = 0;
  public y = 0;

  /**
   * To help show shadows.
   */
  public active: boolean[] = [];

  public e: MouseEvent | null = null;

  get processed() {
    return this.items.map((item) => {
      if (!item) {
        return null;
      }

      return {
        ...item,
        shortcut: item.shortcut ? item.shortcut.join('+') : undefined,
      };
    });
  }

  get style() {
    return {
      left: `${this.x}px`,
      top: `${this.y}px`,
      minWidth: `${this.width}px`,
    };
  }

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
      this.close();
    }
  }

  public close() {
    this.open = false;
    document.removeEventListener('click', this.outsideClickListener);
  }

  public mouseover(i: number) {
    Vue.set(this.active, i, true);
  }

  public mouseleave(i: number) {
    Vue.set(this.active, i, false);
  }

  public show(payload: ContextPayload) {
    this.open = true;
    if (isMouseEvent(payload.event)) {
      this.e = payload.event;
      this.x = payload.event.pageX;
      this.y = payload.event.pageY;
    } else {
      this.x = payload.event.left;
      this.y = payload.event.bottom;
    }

    if (payload.left) {
      this.x -= this.width;
    }

    this.items = payload.items;
    // TODO(jacob)
    // this.$press(['Esc'], this.close);

    document.addEventListener('click', this.outsideClickListener);
  }

  public doCallback(callback: (e: MouseEvent | null) => void) {
    this.open = false;
    callback(this.e);
  }

  @Watch<ContextMenu>('open')
  public onClose() {
    if (this.open) { return; }
    this.active = [];
    this.e = null;
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

.break
  width: 100%
  border-top: 1px solid #484848
  margin: 5px 0

.shortcut
  font-size: 12px

.menu
  z-index: 1000
  position: absolute
  box-shadow: 0px 8px 33px -17px rgba(0,0,0,0.75)
</style>