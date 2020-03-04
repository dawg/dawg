<template>
  <div class="text-sm">
    <div 
      class="flex items-center hover:bg-default-lighten-2 px-2 py-1 cursor-pointer"
      @click="click"
    >
      <dg-fa-icon
        :class="color"
        style="font-size: 8px;"
        icon="circle"
      ></dg-fa-icon>

      <dir class="px-1"></dir>

      <div class="text-default">{{ text }}</div>

      <div class="flex-grow"></div>

      <dg-button v-if="groupedAction" type="icon" @click.stop="expanded = !expanded">
        <dg-fa-icon
          
          class="text-default"
          :icon="caretIcon"
        ></dg-fa-icon>
      </dg-button>
    </div>

    <div
      class="flex items-center px-2 py-1"
      v-for="(command, i) in expandedCommands"
      :key="i"
    >
      <div class="text-default">{{ command.name }}</div>
    </div>
  </div>
</template>

<script lang="ts">
import { createComponent, ref, computed, watch } from '@vue/composition-api';
import * as oly from '@/lib/olyger';

export default createComponent({
  name: 'UndoRedoAction',
  props: {
    action: { type: Object as () => oly.Action<any>, required: true },
    hasBeenExecuted: { type: Boolean, required: true },
  },
  setup(props, context) {
    const expanded = ref(false);

    const caretIcon = computed(() => {
      if (expanded.value) {
        return 'caret-down';
      } else {
        return 'caret-left';
      }
    });

    const color = computed(() => {
      if (props.hasBeenExecuted) {
        return 'fg-primary';
      } else {
        return 'fg-default-lighten-2';
      }
    });

    const text = computed(() => {
      if (props.action.commands.length === 1) {
        return props.action.commands[0].name;
      }

      return `Grouped Action (${props.action.commands.length})`;
    });

    const groupedAction = computed(() => {
      return props.action.commands.length > 1;
    });

    const click = (e: MouseEvent) => {
      context.emit('seek');
    };

    const expandedCommands = computed(() => {
      if (expanded.value) {
        return props.action.commands;
      }

      return [];
    });


    return {
      color,
      caretIcon,
      groupedAction,
      text,
      click,
      expandedCommands,
      expanded,
    };
  },
});
</script>

<style lang="scss" scoped>

</style>
