<template>
  <div class="channel">
    <div class="primary color"></div>
    <editable v-model="channel.name" class="secondary label"></editable>
    <ul>
      <li v-for="(effect, i) in effects" :key="i" class="slot" @click="showEffects($event, i)">
        <div v-if="effect" class="primary" style="height: 2px"></div>
        <div
          v-if="effect"
          @click="select($event, effect)"
          @contextmenu="contextmenu($event, effect)"
          class="effect secondary text-default"
        >
          {{ effect.type | sentenceCase }}
        </div>
        <v-icon 
          v-else
          size="13px" 
          class="close-icon"
        >
          add
        </v-icon>
      </li>
    </ul>
    <div class="spacer"></div>
    <div class="controls">
      <div style="display: flex">
        <div style="display: flex; flex-direction: column; align-items: center">
          <pan
            :value="channel.panner.raw"
            @input="panInput"
            stroke-class="secondary-lighten-2--stroke"
            :size="30"
            @automate="automatePan"
          ></pan>
          <div style="flex-grow: 1"></div>
          <div 
            class="mute text-default"
            :class="{ 'primary-lighten-2': !channel.mute }"
            @click="mute"
          >
            {{ channel.number }}
          </div>
        </div>
        <div class="slider" style="display: flex">
          <slider 
            :value="channel.volume.raw"
            :min="channel.volume.minValue"
            :max="channel.volume.maxValue"
            @input="volumeInput"
            :left="left"
            :right="right"
            @automate="automateVolume"
          ></slider>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';
import { range, scale, clamp } from '@/utils';
import { AnyEffect } from '@/core/filters/effect';
import { Channel as C } from '@/core/channel';
import { EffectMap, EffectName } from '@/core';
import * as base from '@/base';
import { ref, computed, watch, createComponent } from '@vue/composition-api';

function sentenceCase(text: string) {
  // const result = text.replace( /([A-Z])/g, ' $1' );
  // return result.charAt(0).toUpperCase() + result.slice(1);
  return text;
}

// Beware, we are modifying data in the store directly here.
// We will want to change this evetually.
export default createComponent({
  name: 'Channel',
  filters: {
    sentenceCase,
  },
  props: {
    channel: { type: Object as () => C, required: true },
    play: { type: Boolean, required: true },
  },
  setup(props, context) {
    const right = ref(0);
    const left = ref(0);

    const effectLookup = computed(() => {
      const o: { [k: number]: AnyEffect } = {};
      props.channel.effects.forEach((effect) => {
        o[effect.slot] = effect;
      });
      return o;
    });

    const effects = computed(() => {
      return range(10).map((i) => effectLookup.value[i]);
    });

    const options = computed(() => {
      return Object.keys(EffectMap) as EffectName[];
    });

    function showEffects(event: MouseEvent, i: number) {
      const items = options.value.map((option) => ({
        text: sentenceCase(option), callback: () => addEffect(option, i),
      }));

      base.menu({
        position: event,
        items,
      });
    }

    function addEffect(effect: EffectName, i: number) {
      context.emit('add', { effect, index: i });
    }

    function select(event: MouseEvent, effect: AnyEffect) {
      event.stopPropagation();
      context.emit('select', effect);
    }

    function contextmenu(event: MouseEvent, effect: AnyEffect) {
      base.context({
        position: event,
        items: [{
          text: 'Delete',
          callback: () => context.emit('delete', effect),
        }],
      });
    }

    function mute() {
      props.channel.mute = !props.channel.mute;
    }

    function process(level: number) {
      return clamp(scale(level, [-100, 6], [0, 1]), 0, 1);
    }

    function renderMeter() {
      if (props.play) {
        requestAnimationFrame(renderMeter);
        left.value = process(props.channel.left.getLevel());
        right.value = process(props.channel.right.getLevel());
      } else {
        left.value = 0;
        right.value = 0;
      }
    }

    function automatePan() {
      context.root.$automate(props.channel, 'panner');
    }

    function automateVolume() {
      context.root.$automate(props.channel, 'volume');
    }

    function panInput(v: number) {
      props.channel.panner.value = v;
    }

    function volumeInput(v: number) {
      props.channel.volume.value = v;
    }

    watch(() => props.play, () => {
      if (props.play) {
        renderMeter();
      }
    });

    return {
      showEffects,
      automatePan,
      automateVolume,
      panInput,
      volumeInput,
      mute,
      contextmenu,
      effects,
      left,
      right,
    };
  },
});


export class Channel extends Vue {

}
</script>

<style lang="sass" scoped>
$dark: #282c34
$between: #26282b
$light: #767a82

ul
  list-style: none
  padding-left: 0

.color
  height: 5px

.label
  height: 30px
  line-height: 30px
  color: white
  text-align: center
  vertical-align: text-bottom

.channel
  width: 100px
  min-height: 100%
  height: initial
  display: inline-block
  border-right: solid 1px $dark
  margin-bottom: 10px

.slot
  height: 25px
  border-top: solid 1px $between
  position: relative

  &:hover
    cursor: pointer
    background-color: darken($light, 2%)

    .close-icon
      transform: scale(1)
      transition-duration: .1s

  &:last-of-type
    border-bottom: solid 1px $between

.close-icon
  right: 0.5em
  z-index: 2
  width: 1.5em
  height: 1.5em
  line-height: 1.5
  text-align: center
  border-radius: 3px
  overflow: hidden
  transform: scale(0)
  transition: transform .08s
  position: absolute

.controls
  padding: 10px

.mute
  height: 40px
  background-color: #333
  line-height: 40px
  text-align: center
  width: 40px
  user-select: none

  &:hover
    cursor: pointer

.slider
  margin-left: 10px

.effect
  height: 23px
  line-height: 23px
  width: 100%
  text-align: center
  white-space: nowrap
  overflow: hidden
  text-overflow: ellipsis
</style>