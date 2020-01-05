<template>
  <div
    class="text-default"
    :style="{
      position: 'fixed',
      display: state.show ? 'flex' : 'none',
      justifyContent: 'center',
      top: '0',
      left: '0',
      right: '0',
      bottom: '0',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      zIndex: '2000',
    }"
    @click="clickOverlay"
  >
    <div class="bg-default flex flex-col align-stretch" style="width: 400px; height: fit-content;" v-if="state.show">
      <dg-text-field
        class="m-2"
        v-model="state.searchText"
        :placeholder="state.placeholder"
        focus
        @click="stopPropogation"
      ></dg-text-field>
      <ul style="p-1">
        <li
          v-for="(item, i) in filtered"
          :key="i"
          class="
            py-1 
            px-2 
            text-default 
            flex
            items-center
            cursor-pointer 
            hover:bg-default-lighten-2 
            focus:bg-default-lighten-2
          "
          @click="clickResult($event, item)"
        >
          <div>{{ item.text }}</div>
          <div class="flex-grow"></div>
          <div class="text-sm">{{ item.action }}</div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script lang="ts">
import { createComponent, reactive, computed, watch, onMounted, onUnmounted } from '@vue/composition-api';
import { PaletteItem, paletteEvents, PaletteOptions } from '@/dawg/extensions/core/palette/common';

export default createComponent({
  setup() {
    const state = reactive<{
      show: boolean;
      items: PaletteItem[];
      searchText: string;
      placeholder?: string;
      selected: number;
      mode: 'select' | 'input';
    }>({
      show: false,
      items: [],
      searchText: '',
      selected: 0,
      placeholder: '',
      mode: 'select',
    });

    const tokenized = computed(() => {
      return state.items.map((item) => {
        return item.text.split(/ +/).map((token) => token.toLowerCase());
      });
    });

    const searchWords = computed(() => {
      return state.searchText.toLowerCase().split(/ +/);
    });

    const filtered = computed(() => {
      if (!state.searchText) {
        return state.items;
      }

      return tokenized.value
        .map((tokens, i) => {
          if (searchWords.value.every((word) => {
            return tokens.some((token) => token.startsWith(word));
          })) {
            return state.items[i];
          }
        }).filter((item) => item);
    });

    onMounted(() => {
      paletteEvents.on('show', show);
      paletteEvents.on('showTextField', showTextField);
    });

    onUnmounted(() => {
      paletteEvents.removeListener('show', show);
      paletteEvents.removeListener('showTextField', showTextField);
    });

    const showTextField = (opts: PaletteOptions = {}) => {
      state.mode = 'input';
      state.items = [];
      state.show = true;
      state.searchText = '';
      state.placeholder = opts.placeholder;
    };

    function show(items: PaletteItem[], opts: PaletteOptions = {}) {
      state.mode = 'select';
      state.items = items;
      state.show = true;
      state.searchText = '';
      state.placeholder = opts.placeholder;
    }

    function open() {
      state.show = true;
    }

    function checkEnterEsc(e: KeyboardEvent) {
      if (e.which === 27) { // ESC
        // TODOLATER
        // e.preventDefault();
        paletteEvents.emit('cancel');
        state.show = false;
      }

      let newIndex: null | number = null;

      if (e.which === 38) { // UP
        newIndex = state.selected - 1;
      } else if (e.which === 40) { // DOWN
        newIndex = state.selected + 1;
      }

      if (newIndex !== null) {
        if (newIndex >= 0 && newIndex < filtered.value.length) {
          state.selected = newIndex;
        }
      }

      if (e.which === 13) { // ENTER
        if (state.mode === 'input') {
          state.show = false;
          paletteEvents.emit('select', state.searchText);
          return;
        }

        const item = filtered.value[state.selected];
        if (!item) {
          return;
        }

        state.show = false;
        paletteEvents.emit('select', item.text);
      }
    }

    watch(filtered, () => {
      state.selected = 0;
    }, { lazy: true });

    watch(() => state.show, () => {
      if (state.show) {
        window.addEventListener('keydown', checkEnterEsc);
        state.searchText = '';
      } else {
        window.removeEventListener('keydown', checkEnterEsc);
      }
    });

    watch(() => {
      const item = filtered.value[state.selected];
      if (item) {
        paletteEvents.emit('focus', item.text);
      }
    });

    return {
      stopPropogation(e: MouseEvent) {
        // So that the palette doesn't close
        e.stopPropagation();
      },
      clickOverlay: () => {
        paletteEvents.emit('cancel');
        state.show = false;
      },
      clickResult: (e: MouseEvent, item: PaletteItem) => {
        e.stopImmediatePropagation();
        if (item) {
          paletteEvents.emit('select', item.text);
          state.show = false;
        }
      },
      state,
      filtered,
    };
  },
});
</script>
