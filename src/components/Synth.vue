<template>
  <div 
    class="flex flex-col relative z-10"
    @contextmenu="contextmenu"
  >
    <div style="height: 5px" class="bar bg-primary"></div>
    <div
      class="pr-2 flex items-center bg-default-lighten-1"
      color="white"
      style="height: 50px"
      @dblclick="expand = !expand"
      @click="$emit('click', $event)"
    >
      <dot-button
        class="m-3 flex-shrink-0"
        v-model="active"
      ></dot-button>
      <knob
        class="m-3 flex-shrink-0"
        text-color="white"
        :stroke-width="strokeWidth"
        :value="instrument.volume.raw"
        @input="volumeInput"
        @automate="automateVolume"
        name="Volume"
        :min="instrument.volume.minValue"
        :max="instrument.volume.maxValue"
      ></knob>
      <pan
        class="flex-shrink-0"
        :value="instrument.pan.raw"
        @input="panInput"
        @automate="automatePan"
      ></pan>
      <editable
        v-model="instrument.name"
        :contenteditable.sync="contenteditable"
        disableDblClick
        class="text-default name flex-shrink-0"
      ></editable>
      <mini-score
        v-if="notes.length"
        :notes="notes"
        class="score bg-default flex-shrink flex-grow"
      ></mini-score>
      <div v-else class="flex-grow"></div>
      <channel-select
        class="flex-shrink-0"
        :value="channel"
        @input="setChannel"
      ></channel-select>
    </div>
    <div 
      class="options bg-default-lighten-1"
      :class="{ expand }"
    >
      <dg-select
        class="my-2 mx-5 grid"
        :options="instrument.types"
        v-model="instrument.type"
      ></dg-select>
    </div>
  </div>
</template>

<script lang="ts">
import DotButton from '@/components/DotButton.vue';
import MiniScore from '@/components/MiniScore.vue';
import ChannelSelect from '@/components/ChannelSelect.vue';
import { Note, Instrument, Sequence } from '@/core';
import { update } from '@/utils';
import { createComponent, computed, watch, ref } from '@vue/composition-api';
import * as framework from '@/framework';

export default createComponent({
  name: 'Synth',
  components: { DotButton, MiniScore, ChannelSelect },
  props: {
    instrument: { type: Object as () => Instrument<any, any>, required: true },
    height: { type: Number, default: 50 },
    notes: { type: Array as () => Note[], default: () => [] },
    channel: Number as () => number | undefined,
  },
  setup(props, context) {
    const active = ref(!props.instrument.mute);
    const expand = ref(false);
    const strokeWidth = 2.5;
    const contenteditable = ref(false);

    function setChannel(v: number | undefined) {
      update(props, context, 'channel', v);
    }

    function volumeInput(v: number) {
      props.instrument.volume.value = v;
    }

    function panInput(v: number) {
      props.instrument.pan.value = v;
    }

    function automateVolume() {
      // context.root.$automate(props.instrument, 'volume');
    }

    function automatePan() {
      // context.root.$automate(props.instrument, 'pan');
    }

    watch(active, () => {
      props.instrument.mute = !active.value;
    });

    function contextmenu(event: MouseEvent) {
      framework.context({
        position: event,
        items: [
          {
            callback: () => context.emit('delete'),
            text: 'Delete',
          },
          {
            callback: () => context.emit('open'),
            text: 'Open In Piano Roll',
          },
          {
            callback: () => contenteditable.value = true,
            text: 'Rename',
          },
        ],
      });
    }

    return {
      active,
      contextmenu,
      automatePan,
      automateVolume,
      panInput,
      volumeInput,
      setChannel,
      expand,
      strokeWidth,
      contenteditable,
    };
  },
});
</script>

<style scoped lang="scss">
.name {
  font-size: 1.2em;
  min-width: 140px;
  display: block;
  padding-left: 10px;
  user-select: none;
}

.options {
  transition: height .5s;
  height: 0;
  overflow: hidden;
}

.expand {
  height: 55px;
}

.score {
  margin: 5px 10px;
  padding: 2px 5px;
  height: 75%;
  border-radius: 3px;
}
</style>