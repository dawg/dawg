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
import bus, { isMouseEvent, Position, ContextPayload } from '@/dawg/extensions/core/menu/bus';
import { Watch } from '@/modules/update';
import { computed, onMounted, onDestroyed, watch, value } from 'vue-function-api';
import { createComponent } from '@/utils';
import { commands } from '@/dawg/extensions/core/commands';
import { ClickCommand } from '@/dawg/base/ui';

export default createComponent({
  props: {
    /**
     * The default width of the menu.
     */
    width: { type: Number, default: 300 },
  },
  setup(props, context) {
    const items = value<Array<ClickCommand | null>>([]);
    const open = value(false);
    const x = value(0);
    const y = value(0);

    /**
     * To help show shadows.
     */
    const active = value<boolean[]>([]);
    let e: MouseEvent | null = null;

    const processed = computed(() => {
      return items.value.map((item) => {
        if (!item) {
          return null;
        }

        return {
          ...item,
          shortcut: item.shortcut ? item.shortcut.join('+') : undefined,
        };
      });
    });

    const style = computed(() => {
      return {
        left: `${x.value}px`,
        top: `${y.value}px`,
        minWidth: `${props.width}px`,
      };
    });

    function outsideClickListener(event: MouseEvent) {
      if (!event.target) {
        return;
      }

      if (!context.root.$el.contains(event.target as Node)) {
        close();
      }
    }

    function close() {
      open.value = false;
      document.removeEventListener('click', outsideClickListener);

      if (disposer) {
        disposer.dispose();
        disposer = null;
      }
    }

    function mouseover(i: number) {
      Vue.set(active.value, i, true);
    }

    function mouseleave(i: number) {
      Vue.set(active.value, i, false);
    }

    let disposer: { dispose(): void } | null = null;
    function show(payload: ContextPayload) {
      open.value = true;
      if (isMouseEvent(payload.event)) {
        e = payload.event;
        x.value = payload.event.pageX;
        y.value = payload.event.pageY;
      } else {
        x.value = payload.event.left;
        y.value = payload.event.bottom;
      }

      if (payload.left) {
        x.value -= props.width;
      }

      items.value = payload.items;
      disposer = commands.registerCommand({
        text: 'Close Context Menu',
        callback: close,
        shortcut: ['Esc'],
      });

      document.addEventListener('click', outsideClickListener);
    }

    function doCallback(callback: (e: MouseEvent | null) => void) {
      close();
      callback(e);
    }

    watch(open, () => {
      if (open.value) { return; }
      active.value = [];
      e = null;
    });

    onMounted(() => {
      bus.$on('show', show);
    });

    onDestroyed(() => {
      // Make sure to remove all stray listeners
      bus.$off('show', show);
      document.removeEventListener('click', outsideClickListener);
    });

    return {
      processed,
      doCallback,
      mouseover,
      mouseleave,
      active, style,
      open,
    };
  },
});

@Component
export class ContextMenu extends Vue {

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