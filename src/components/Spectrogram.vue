<template>
  <canvas 
    class="spectrogram" 
    ref="canvas" 
    :width="width"
  ></canvas>
</template>

<script lang="ts">
import tinycolor from 'tinycolor2';
import * as Audio from '@/audio';
import { computed, onUnmounted, createComponent, ref } from '@vue/composition-api';

export default createComponent({
  name: 'Spectrogram',
  props: {
    height: { type: Number, default: 50 },
    color: { type: String, required: true },
  },
  setup(props, context) {
    const width = 100;
    let ctx: CanvasRenderingContext2D | null = null;
    const analyserNode = Audio.Context.context.createAnalyser();
    const analyserData = new Uint8Array(512);
    const output = Audio.Master;

    const tiny = computed(() => {
      return tinycolor(props.color);
    });

    const colors = computed(() => {
      return [0, 10, 20, 30, 40, 50, 60, 90, 100].map((value) => {
        const color = tiny.value.setAlpha(value).toRgb();
        return [
          color.r,
          color.g,
          color.b,
          color.a,
        ];
      });
    });

    const canvas = ref<HTMLCanvasElement>(null);
    function mounted() {
      ctx = canvas.value!.getContext('2d');
      analyserNode.fftSize = 1024;
      output.connect(analyserNode);
      requestAnimationFrame(doRender);
    }

    onUnmounted(() => {
      output.connect(analyserNode);
    });

    function doRender() {
      if (!ctx) {
        return;
      }

      analyserNode.getByteFrequencyData(analyserData);
      const img = ctx.createImageData(analyserData.length, 1);

      const datalen = analyserData.length;

      let arr: number[] = new Array(datalen).fill(0);
      arr = arr.map((value, i) => Math.log(datalen / (i + 1)));
      const sum = arr.reduce((current, value) => current + value, 0);
      arr = arr.map((value) =>  value / sum * width);


      for (let i = 0, x = 0; i < datalen; ++i) {
        let r;
        let g;
        let b;
        let a = 0;
        let datum = 1 - Math.cos(analyserData[i] / 255 * Math.PI / 2);

        if (datum < .05) {
          r = 4 + 10 * datum;
          g = 4 + 10 * datum;
          b = 5 + 20 * datum;
        } else {
          let col;
          let colId;

          if (datum < .08) {
            colId = 0;
            datum /= .08;
          } else if (datum < .15) {
            colId = 1;
            datum /= .15;
          } else if (datum < .17) {
            colId = 2;
            datum /= .17;
          } else if (datum < .25) {
            colId = 3;
            datum /= .25;
          } else if (datum < .3) {
            colId = 4;
            datum /= .3;
          } else if (datum < .4) {
            colId = 5;
            datum /= .4;
          } else if (datum < .6) {
            colId = 6;
            datum /= .6;
          } else if (datum < .8) {
            colId = 7;
            datum /= .8;
          } else {
            colId = 8;
          }

          col = colors.value[colId];
          r = col[0] * datum;
          g = col[1] * datum;
          b = col[2] * datum;
          a = col[3] * datum;
        }

        ctx.fillStyle = `rgba(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)}, ${a})`;
        ctx.clearRect(x, 0, arr[i], props.height * 3);
        ctx.fillRect(x, 0, arr[i], props.height * 3);
        x += arr[i];
      }
      requestAnimationFrame(doRender);
    }

    return {
      width,
      canvas,
    };
  },
});
</script>

<style scoped lang="sass">
.spectrogram
  height: 100%
  width:  25%
</style>
