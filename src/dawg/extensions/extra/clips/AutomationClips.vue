<template>
  <div class="automation-clips">
    <drag
      v-for="(item, i) in items"
      group="arranger"
      :key="i"
      @contextmenu.native="context($event, i)"
      class="clip foreground--text"
      :transfer-data="item.prototype"
    >
      {{ item.name }}
    </drag>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';
import { general } from '@/store';
import { ScheduledAutomation } from '@/core';
import * as dawg from '@/dawg';

@Component
export default class AutomationClips extends Vue {
  get project() {
    return general.project;
  }

  get items() {
    return general.project.automationClips.map((clip, i) => {
      return {
        prototype: ScheduledAutomation.create(clip, 0, 0),
        name: `Automation ${i}`,
      };
    });
  }

  public context(event: MouseEvent, i: number) {
    dawg.context.context({
      event,
      items: [
        {
          text: 'Delete',
          callback: () => general.project.remoteAutomation(i),
        },
      ],
    });
  }
}
</script>

<style lang="sass" scoped>
.clip
  padding: 10px 20px
  color: white

  &:hover
    box-shadow: inset 0 0 100px 100px rgba(255, 255, 255, 0.1)
    cursor: pointer
</style>