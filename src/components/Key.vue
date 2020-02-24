<template>
  <div 
    class="key"
    :class="keyClass" 
    :style="keyStyle" 
    @mousedown="mousedown"
    @mouseenter="enter"
    @mouseleave="exit"
  >
    <div
      :style="keyOverlay"
      class="overlay"
    ></div>
    <div v-if="text" class="text">{{ text }}</div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Inject, Vue } from 'vue-property-decorator';
import { Instrument } from '@/models';
import * as framework from '@/lib/framework';
import { ref, computed, createComponent } from '@vue/composition-api';

export default createComponent({
  name: 'Key',
  props: {
    keyHeight: { type: Number, required: true },
    value: { type: String, required: true },
    synth: { type: Object as () => Instrument<any, any> | undefined, required: false },
    width: { type: Number, default: 80 },
    widthProportion: { type: Number, default: 0.55 },
    heightProportion: { type: Number, default: 0.50 },
    borderBottom: Boolean as () => boolean | undefined,
  },
  setup(props, context) {
    const down = ref(false);
    const hover = ref(false);

    const color = computed(() => {
      return props.value.includes('#') ? 'black' : 'white';
    });

    const height = computed(() => {
      return props.keyHeight * (12 / 7);  // all keys / white keys
    });

    const keyClass = computed(() => {
      return {
        'c': isC.value,
        'primary-lighten-4': down.value,
        [`key--${color.value} ${props.value}`]: true,
      };
    });

    const isC = computed(() => {
      return props.value.startsWith('C') && color.value === 'white';
    });

    const text = computed(() => {
      if (isC.value) {
        return props.value;
      }
    });

    const percentage = computed(() => {
      return hover.value ? 50 : isC.value ? 30 : 10;
    });

    const keyOverlay = computed(() => {
      return {
        backgroundColor: framework.theme.primary + percentage.value,
        borderBottom: `1px solid ${framework.theme.primary + 10}`,
      };
    });

    const keyStyle = computed(() => {
      if (color.value === 'black') {
        return {
          transform: `translate(0, -${(height.value * props.heightProportion) / 2}px)`,
          height: `${height.value * props.heightProportion}px`,
          width: `${props.widthProportion * 100}%`,
        };
      }
      return {
        borderBottom: props.borderBottom ? 'solid 1px rgba(0, 0, 0, 0.06)' : '',
        height: `${height.value}px`,
        width: `100%`,
      };
    });

    function mousedown() {
      context.emit('start', props.value);
      down.value = true;
      window.addEventListener('mouseup', mouseup);
    }

    function mouseup() {
      window.removeEventListener('mouseup', mouseup);
      down.value = false;
      context.emit('stop', props.value);
    }

    function enter() {
      hover.value = true;
    }

    function exit() {
      hover.value = false;
    }

    return {
      keyClass,
      keyStyle,
      mousedown,
      enter,
      exit,
      keyOverlay,
      text,
    };
  },
});
</script>

<style scoped lang="sass">
$color_white: #eee
$color_black: #3b3b3b

.overlay
  position: absolute
  left: 0
  right: 0
  top: 0
  bottom: 0
  
.text
  position: absolute
  user-select: none
  right: 0
  bottom: 0
  font-size: 0.8em

.key
  position: relative

.key--white
  background-color: $color_white

  &:hover
    background-color: darken($color_white, 6)

.key--black
  background-color: $color_black
  position: absolute
  z-index: 20
  transition: 0.1s
  &:hover
    background-color: darken($color_black, 6)

.c
  background-color: darken($color_white, 3)
</style>
