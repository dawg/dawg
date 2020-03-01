<template>
  <div class="audio-files">
    <drag
      v-for="(item, i) in items"
      group="arranger"
      :key="i"
      @click.native="onClick(item.sample)"
      @contextmenu.native="context($event, i)"
      class="text-default text-sm py-2 px-4 cursor-pointer hover:bg-default-lighten-2"
      :transfer-data="item.prototype"
    >
      {{ item.sample.name }}
    </drag>
  </div>
</template>

<script lang="ts">
import { ScheduledSample, Sample, createSamplePrototype } from '@/models';
import * as dawg from '@/dawg';
import { createComponent, computed } from '@vue/composition-api';
import { useClicker } from '@/lib/vutils';

export default createComponent({
  name: 'AudioFiles',
  setup() {
    let dispose: (() => void) | null = null;

    const items = computed(() => {
      return dawg.project.samples.map((sample) => {
        return {
          prototype: createSamplePrototype({ row: 0, time: 0, duration: sample.beats }, sample, {}),
          sample,
        };
      });
    });

    function context(event: MouseEvent, i: number) {
      dawg.context({
        position: event,
        items: [
          {
            text: 'Delete',
            callback: () => {
              dawg.project.samples.splice(i, 1);
              // TODO
              // undoer = pattern.notifyOfDeletion();
            },
          },
        ],
      });
    }

    function start(sample: Sample) {
      if (dispose) {
        dispose();
        dispose = null;
      }

      const result = sample.preview();
      if (result.started) {
        dispose = result.dispose;
      }
    }

    function open(sample: Sample) {
      dawg.sampleViewer.openedSample.value = sample;
    }

    const onClick = useClicker({
      onClick: start,
      onDblClick: open,
    });

    return {
      onClick,
      items,
      context,
    };
  },
});

</script>
