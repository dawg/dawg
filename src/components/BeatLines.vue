<template>
  <div 
    class="beat-lines"
    :style="style"
  ></div>
</template>

<script lang="ts">
import * as dawg from '@/dawg';
import { range } from '@/lib/std';
import { createComponent, ref, computed } from '@vue/composition-api';

export default createComponent({
  name: 'BeatLines',
  props: {
    pxPerBeat: { type: Number, required: true },
    beatsPerMeasure: { type: Number, required: true },
    stepsPerBeat: { type: Number, required: true },
  },
  setup(props) {
    const el = ref<HTMLElement>();

    const measureColor = computed(() => {
      return dawg.theme.darken(dawg.theme.default, 5);
    });

    const stepColor = computed(() => {
      return dawg.theme.darken(dawg.theme.default, 2);
    });

    const beatColor = computed(() => {
      return dawg.theme.darken(dawg.theme.default, 4);
    });

    const viewBox = computed(() => {
      return props.pxPerBeat * props.beatsPerMeasure;
    });

    const stepPx = computed(() => {
      return props.pxPerBeat / props.stepsPerBeat;
    });

    const measureSteps = computed(() => {
      return props.stepsPerBeat * props.beatsPerMeasure;
    });

    const svg = computed(() => {
      const steps = range(1, measureSteps.value).map((step) => {
        const fill = step % props.beatsPerMeasure ? stepColor.value : beatColor.value;
        const rectX = stepPx.value + stepPx.value * (step - 1) - .5;
        return `<rect fill="${fill}" height="1px" width="1px" y="0" x="${rectX}"/>`;
      });

      const x = stepPx.value + stepPx.value * (measureSteps.value - 1) - 1.5;
      steps.push(`<rect fill="${measureColor.value}" height="1px" width="3px" y="0" x="${x}"/>`);
      return `
  <svg
    preserveAspectRatio="none"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 ${viewBox.value} 1"
  >
    ${steps.join('\n  ')}
  </svg>
      `;
    });

    const style = computed(() => {
      return {
        backgroundRepeat: 'repeat',
        backgroundAttachment: 'local',
        // See https://github.com/apache/cordova-android/issues/645
        // for why we prepend '%23' instead of #
        // Annoyingly encodeURI does not yet do this so we have to do it manually
        backgroundImage: `url("data:image/svg+xml, ${encodeURI(svg.value).replace(/#/g, '%23')}")`,
        backgroundSize: `${viewBox.value}px 1px`,
      };
    });

    return {
      el,
      style,
    };
  },
});


</script>
