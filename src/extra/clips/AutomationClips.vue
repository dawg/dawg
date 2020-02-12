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
import { Vue, Component, Prop } from 'vue-property-decorator';
import { ScheduledAutomation } from '@/models';
import * as dawg from '@/dawg';

@Component
export default class AutomationClips extends Vue {
  get items() {
    return dawg.project.automationClips.map((clip, i) => {
      return {
        prototype: ScheduledAutomation.create(clip, 0, 0),
        name: `Automation ${i}`,
      };
    });
  }

  public context(event: MouseEvent, i: number) {
    dawg.context({
      position: event,
      items: [
        {
          text: 'Delete',
          callback: () => dawg.project.removeAutomation(i),
        },
      ],
    });
  }
}
</script>
