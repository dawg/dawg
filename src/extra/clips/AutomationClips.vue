<template>
  <div>
    <drag
      v-for="(item, i) in items"
      group="arranger"
      :key="i"
      @contextmenu.native="context($event, i)"
      class="text-default text-sm py-2 px-4 cursor-pointer hover:bg-default-lighten-2"
      :transfer-data="item.prototype"
    >
      {{ item.name }}
    </drag>
  </div>
</template>

<script lang="ts">
import { ScheduledAutomation, createAutomationPrototype } from '@/models';
import * as dawg from '@/dawg';
import { createComponent, computed } from '@vue/composition-api';
import * as oly from '@/lib/olyger';
import { useSubscriptions } from '@/lib/vutils';

export default createComponent({
  name: 'AutomationClips',
  props: {},
  setup() {
    const items = computed(() => {
      return dawg.project.automationClips.map((clip, i) => {
        return {
          prototype: createAutomationPrototype({ time: 0, row: 0, duration: clip.duration }, clip, {}),
          name: clip.name,
        };
      });
    });

    function context(event: MouseEvent, i: number) {
      dawg.context({
        position: event,
        items: [
          {
            text: 'Delete',
            callback: () => dawg.project.automationClips.splice(i, 1),
          },
        ],
      });
    }

    return {
      items,
      context,
    };
  },
});
</script>
