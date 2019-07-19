<template>
  <svg class="waveform" preserveAspectRatio="none" :viewBox="viewBox">
    <polygon 
      :points="points" 
      :fill="color"
      :stoke="color"
      style="stroke-width:0.2; shape-rendering: geometricPrecision"
    ></polygon>
  </svg>
</template>

<script lang="ts">

import { Vue, Component, Prop, Mixins } from 'vue-property-decorator';
import { Player } from 'tone';
import { Nullable } from '@/utils';
import { Watch } from '@/modules/update';
import * as base from '@/base';

@Component
export default class Waveform extends Vue {
  @Prop({ type: AudioBuffer, required: true }) public buffer!: AudioBuffer;
  @Prop({ type: Number, default: 0 }) public offset!: number;
  @Prop({ type: Number, default: 50 }) public height!: number;
  @Prop({ type: Number, default: 100 }) public width!: number;

  get viewBox() {
    return '0 0 ' + this.steps + ' ' + this.height;
  }

  get color() {
    return base.theme.foreground;
  }

  get h2() {
    return this.height / 2;
  }

  get steps() {
    return this.width * 100;
  }
  // make getters
  get points() {
    const data0 = this.buffer.getChannelData( 0 );
    const data1 = this.buffer.numberOfChannels > 1 ? this.buffer.getChannelData( 1 ) : data0;
    const duration = this.buffer.duration - this.offset;

    const dataLen = data0.length;
    const ind = Math.floor(( this.offset / this.buffer.duration ) * dataLen );
    const step = duration / this.buffer.duration * dataLen / this.steps;
    let dots0 = '0,' + ( this.h2 + data0[ ind ] * this.h2 );
    let dots1 = '0,' + ( this.h2 + data1[ ind ] * this.h2 );
    const iinc = Math.floor(Math.max( 1, step / 100));

    for ( let p = 1; p < this.steps; p += 1 ) {
      let lmin = Infinity;
      let rmax = -Infinity;
      let i = Math.floor( ind + ( p - 1 ) * step );
      const iend = i + step;

      for ( ; i < iend; i += iinc ) {
        lmin = Math.min( lmin, data0[ i ], data1[ i ] );
        rmax = Math.max( rmax, data0[ i ], data1[ i ] );
      }

      if ( Math.abs( rmax - lmin ) * this.h2 < 1 ) {
        rmax += 1 / this.height;
        lmin -= 1 / this.height;
      }

      dots0 += ' ' + p + ',' + ( this.h2 + lmin * this.h2 );
      dots1  =       p + ',' + ( this.h2 + rmax * this.h2 ) + ' ' + dots1;
    }

    return dots0 + ' ' + dots1;
  }
}
</script>

<style scoped>
</style>