<template>
  <canvas class="myCanvas" ref="canvas" :width="width" backgroundColor="white">
  </canvas>
</template>

<script lang="ts">
import Vue from 'vue';
import Tone from 'tone';
import tinycolor from 'tinycolor2';
import * as Audio from '@/modules/audio';
import { Component, Prop } from 'vue-property-decorator';

@Component({components: { }})
export default class Spectrogram extends Vue {
  public width = 100;
  public context: CanvasRenderingContext2D | null = null;
  public analyserNode = Audio.context.createAnalyser();
  public analyserData = new Uint8Array(512);
  @Prop({ type: Number, default: 50}) public height!: number;
  @Prop({ type: String, required: true}) public color!: string;

  public $refs!: {
    canvas: HTMLCanvasElement;
  };

  get tiny() {
    return tinycolor(this.color);
  }

  get transformatino() {
    return this.tiny.isLight() ? 'darken' : 'lighten';
  }

  get colors() {
    const percentages = [0, 10, 20, 30, 40, 50, 60, 90, 100];
    // if (this.tiny.isLight()) {
    //   percentages.reverse();
    // }

    return percentages.map((value) => {
      const color = this.tiny.setAlpha(value).toRgb();
      return [
        color.r,
        color.g,
        color.b,
        color.a,
      ]
    })
  }

  public mounted() {
    console.log(this);
    this.context = this.$refs.canvas.getContext('2d');
    this.analyserNode.fftSize = 1024;
    // @ts-ignore
    const output = Tone.Master.output as AudioNode;
    output.connect(this.analyserNode);
    requestAnimationFrame(this.doRender);
  }

  public destroyed() {
    // @ts-ignore
    const output = Tone.Master.output as AudioNode;
    output.connect(this.analyserNode);
  }

  public doRender() {
    if (!this.context) {
      return;
    }
    this.analyserNode.getByteFrequencyData( this.analyserData );
    // console.log(this.analyserData.slice(0, 100));
    const img = this.context.createImageData(this.analyserData.length, 1);

    // this.width = this.analyserData.length;
    const datalen = this.analyserData.length;

    const arr = ( new Array( datalen ) ).fill( 0 );
    const sum = arr.reduce( ( sum, _, i, arr ) => (
      sum += arr[ i ] = Math.log( datalen / ( i + 1 ) )
    ), 0);
    arr.forEach( ( val, i, arr ) => {
      arr[ i ] = val / sum * this.width;
    });


    for ( let i = 0, x = 0; i < datalen; ++i ) {
      let r;
      let g;
      let b;
      let a = 0;
      let datum = 1 - Math.cos( this.analyserData[ i ] / 255 * Math.PI / 2 );

      if ( datum < .05 ) {
        r = 4 + 10 * datum;
        g = 4 + 10 * datum;
        b = 5 + 20 * datum;
      } else {
        let col;
        let colId;

        if ( datum < .08 ) {
          colId = 0; datum /= .08;
        } else if ( datum < .15 ) {
          colId = 1; datum /= .15;
        } else if ( datum < .17 ) {
          colId = 2; datum /= .17;
        } else if ( datum < .25 ) {
          colId = 3; datum /= .25;
        } else if ( datum < .3  ) {
          colId = 4; datum /= .3;
        } else if ( datum < .4  ) {
          colId = 5; datum /= .4;
        } else if ( datum < .6  ) {
          colId = 6; datum /= .6;
        } else if ( datum < .8  ) {
          colId = 7; datum /= .8;
        } else {
          colId = 8;
        }

        col = this.colors[ colId ];
        r = col[0] * datum;
        g = col[1] * datum;
        b = col[2] * datum;
        a = col[3] * datum;
      }

      // r = this.tiny.r + r;
      // g = this.tiny.g + g;
      // b = this.tiny.b + b;

      this.context.fillStyle = `rgba(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)}, ${a})`;
      this.context.clearRect( x, 0, arr[ i ], this.height * 3 );
      this.context.fillRect( x, 0, arr[ i ], this.height * 3 );
      x += arr[ i ];
      // console.log(arr);
    }
    requestAnimationFrame(this.doRender);
  }
}

// const colors = [
// [   5,   2,  20 ], // 0
// [   8,   5,  30 ], // 1
// [  15,   7,  50 ], // 2
// [  75,   7,  35 ], // 3
// [  80,   0,   0 ], // 4
// [ 180,   0,   0 ], // 5
// [ 200,  25,  10 ], // 6
// [ 200, 128,  10 ], // 7
// [ 200, 200,  20 ], // 8
// ];
</script>

<style scoped lang="sass">
.myCanvas
  height: 100%
  width:  25%

</style>
