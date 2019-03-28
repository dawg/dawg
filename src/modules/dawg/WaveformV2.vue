<template>
  <svg class="waveform" preserveAspectRatio="none" :viewBox="viewBox">
    <polygon
      :points="points" 
      style="stroke:white;fill:white;stroke-width:0.1;shape-rendering: geometricPrecision"
    ></polygon>
  </svg>
</template>

<script lang="ts">

import { Vue, Component, Prop, Mixins } from 'vue-property-decorator';
import WaveSurfer from 'wavesurfer.js';
import { Player } from 'tone';
import { Nullable } from '@/utils';
import { Watch } from '@/modules/update';

@Component({components: { }})
export default class WaveformV2 extends Vue {
  @Prop({ type: AudioBuffer, required: true }) public buffer!: AudioBuffer;
  @Prop({ type: Number, required: true }) public offset!: number;
  // @Prop({ type: Number, required: true }) public duration!: number;
  @Prop({ type: Number, default: 50 }) public height!: number;
  @Prop({ type: Number, default: 100 }) public width!: number;

  public points = '';

  get viewBox() {
    return '0 0 ' + this.width * 100 + ' ' + this.height;
  }

  public remove() {
    this.empty();
    // this.rootElement.remove();
  }

  public empty() {
    // this.polygon.removeAttribute( 'points' );
  }

  public mounted() {
    const data0 = this.buffer.getChannelData( 0 );
    const data1 = this.buffer.numberOfChannels > 1 ? this.buffer.getChannelData( 1 ) : data0;
    const duration = this.buffer.duration - this.offset;

    let p;
    const w = this.width * 100;
    const h = this.height;
    const h2 = h / 2;
    const dataLen = data0.length;
    const ind = Math.floor(( this.offset / this.buffer.duration ) * dataLen );
    const step = duration / this.buffer.duration * dataLen / w;
    let dots0 = '0,' + ( h2 + data0[ ind ] * h2 );
    let dots1 = '0,' + ( h2 + data1[ ind ] * h2 );
    const iinc = Math.floor(Math.max( 1, step / 100));

    for ( p = 1; p < w; p += 1 ) {
      let lmin = Infinity;
      let rmax = -Infinity;
      let i = Math.floor( ind + ( p - 1 ) * step );
      const iend = i + step;

      for ( ; i < iend; i += iinc ) {
        lmin = Math.min( lmin, data0[ i ], data1[ i ] );
        rmax = Math.max( rmax, data0[ i ], data1[ i ] );
      }
      if ( Math.abs( rmax - lmin ) * h2 < 1 ) {
        rmax += 1 / h;
        lmin -= 1 / h;
      }
      dots0 += ' ' + p + ',' + ( h2 + lmin * h2 );
      dots1  =       p + ',' + ( h2 + rmax * h2 ) + ' ' + dots1;
    }

    this.points = dots0 + ' ' + dots1;
  }
}
</script>

<style scoped>
</style>