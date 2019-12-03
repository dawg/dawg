<template>
  <div 
    class="synth-wrapper"
    style="position: relative; z-index: 10;"
  >
    <div 
      class="bar primary"
    ></div>
    <div 
      class="synth secondary-lighten-1" 
      color="white"
      :style="synthStyle"
      @dblclick="expand = !expand"
      @click="$emit('click', $event)"
    >
      <dot-button
        class="mute"
        v-model="active"
      ></dot-button>
      <knob
        class="knob"
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
        :value="instrument.pan.raw"
        @input="panInput"
        @automate="automatePan"
      ></pan>
      <div class="foreground--text name">{{ instrument.name }}</div>
      <mini-score
        v-if="notes.length"
        :notes="notes"
        class="score secondary"
      ></mini-score>
      <div style="flex: 1"></div>
      <channel-select
        :value="channel"
        @input="setChannel"
      ></channel-select>
    </div>
    <div 
      class="options secondary-lighten-1"
      :class="{ expand }"
    >
      <v-select
        class="synth-dropdown"
        dense
        dark
        :items="instrument.types"
        v-model="instrument.type"
      ></v-select>
    </div>
  </div>
</template>

<script lang="ts">
import DotButton from '@/components/DotButton.vue';
import MiniScore from '@/components/MiniScore.vue';
import ChannelSelect from '@/components/ChannelSelect.vue';
import { Note, Instrument, Sequence } from '@/core';
import { createComponent, update } from '@/utils';
import { computed, watch, value } from 'vue-function-api';

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
    const active = value(!props.instrument.mute);
    const expand = value(false);
    const strokeWidth = 2.5;

    const synthStyle = computed(() => {
      return {
        height: `${props.height}px`,
      };
    });

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
      context.root.$automate(props.instrument, 'volume');
    }

    function automatePan() {
      context.root.$automate(props.instrument, 'pan');
    }

    watch(active, () => {
      props.instrument.mute = !active.value;
    });

    return {
      active,
      automatePan,
      automateVolume,
      panInput,
      volumeInput,
      setChannel,
      synthStyle,
      expand,
      strokeWidth,
    };
  },
});
</script>

<style scoped lang="sass">
.synth
  align-items: center
  display: flex
  padding-right: 10px

.mute
  height: 20px
  width: 20px
  margin: 5px

.synth-dropdown
  padding: 5px 18px

.synth-dropdown /deep/ .v-input__slot
  margin: 0!important

.knob
  margin: 5px

.name
  font-size: 1.2em
  min-width: 140px
  display: block
  padding-left: 10px
  user-select: none

.synth-wrapper
  display: flex
  flex-direction: column

.bar
  height: 5px

.options
  transition: height .5s
  height: 0
  overflow: hidden

.expand
  height: 55px

.score
  margin: 5px 10px
  padding: 2px 5px
  height: 75%
  border-radius: 3px
</style>