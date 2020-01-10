<template>
  <div 
    class="sample-viewer bg-default"
  >
    <div class="sample">    
      <waveform 
        class="wave" 
        v-if="buffer"
        :buffer="buffer"
      ></waveform>
    </div>
    <div class="sample-controls text-default">
      <div style="flex: 1"></div>
      <span class="control">
        <dg-button @click="playPause" type="text">
          {{ buttonText }}
        </dg-button>
      </span>
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
import { Sample } from '@/core';
import { Nullable } from '@/utils';
import { Action } from '@/dawg/extensions/core/sample-viewer/types';
import { createComponent, computed } from '@vue/composition-api';

export default createComponent({
  name: 'SampleViewer',
  props: {
    sample: { type: Nullable(Object) as any as () => Sample | null },
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
      if (props.sample) {
        if (disposer) {
          disposer.dispose();
          disposer = null;
        } else {
          const result = props.sample.preview({
            onended: () => {
              if (disposer) {
                disposer.dispose();
              }
            },
          });
          if (result.started) {
            disposer = result;
          }
        }
      }
    }

    return {
      playPause,
      actionsWithSamplePath,
      buffer,
      buttonText: computed(() => {
        return disposer ? 'Stop' : 'Play';
      }),
    };
  },
});
</script>

<style lang="sass" scoped>
.sample-viewer
  height: 100%
  padding-bottom: 70px
  padding-top: 5px
  padding-left: 40px
  padding-right: 40px

.sample
  height: 100%
  width: 100%

.wave
  height: 100%
  width: 100%

.sample-controls
  padding-top: 20px
  position: fixed
  bottom: 35px
</style>