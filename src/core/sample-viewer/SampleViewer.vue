<template>
  <div 
    class="pt-1 pb-5 px-6 h-full bg-default flex justify-end flex-col"
  >
    <waveform
      @click.native="playPause"
      class="flex-grow w-full cursor-pointer" 
      v-if="buffer"
      :buffer="buffer"
    ></waveform>
    <div class="pt-4 text-default">
      <div style="flex: 1"></div>
      <dg-button
        v-for="(action, i) in actionsWithSamplePath"
        class="ml-2"
        type="text"
        :key="i"
        @click="action.callback"
      >
        {{ action.text }}
      </dg-button>
    </div>
  </div>
</template>

<script lang="ts">
import { Sample } from '@/models';
import { Nullable } from '@/lib/vutils';
import { Action } from '@/core/sample-viewer/types';
import { createComponent, computed } from '@vue/composition-api';

export default createComponent({
  name: 'SampleViewer',
  props: {
    sample: Object as () => Sample,
    actions: { type: Array as () => Action[], required: true },
  },
  setup(props) {
    const actionsWithSamplePath = computed(() => {
      return props.actions.map((action) => {
        return {
          text: action.text,
          callback: () => {
            if (samplePath.value) {
              action.callback(samplePath.value);
            }
          },
        };
      });
    });

    const buffer = computed(() => {
      if (props.sample) {
        return props.sample.buffer;
      } else {
        return null;
      }
    });

    const samplePath = computed(() => {
      if (props.sample) {
        return props.sample.path;
      }
    });

    let disposer: { dispose: () => void } | null = null;
    function playPause() {
      if (!props.sample) {
        return;
      }

      // if started but not stopped
      if (disposer) {
        disposer.dispose();
        disposer = null;
        return;
      }

      const result = props.sample.preview({
        onended: () => {
          if (disposer) {
            disposer.dispose();
            disposer = null;
          }
        },
      });

      if (result.started) {
        disposer = result;
      }
    }

    return {
      playPause,
      actionsWithSamplePath,
      buffer,
    };
  },
});
</script>
