<template>
  <canvas class="myCanvas secondary">
    
  </canvas>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';

@Component({components: { }})
export default class Spectrogram extends Vue {
  @Prop({ type: Number, default: 50}) public height!: number;
  @Prop({ type: Number, default: 100 }) public width!: number;



  get steps() {
    return this.width;
  }

  get h() {
    return this.height;
  }


  public setCanvas( ) {
// this.rootElement = cnv;
// this._scaleToData = true;
// this._ctx = cnv.getContext( "2d" );
// cnv.classList.add( "gsuiSpectrum" );
  }

  public clear() {
// this._ctx.clearRect( 0, 0, this.rootElement.width, 1 );
  }

  // get data() {
  //   //return TODO;
  // }

  public mounted() {
    const datalen = this.data.length;
    // const img = ctx.createImageData( datalen, 1 );

    for ( let i = 0, x = 0; i < datalen; ++i, x += 4 ) {
      let r;
      let g;
      let b;
      let datum = 1 - Math.cos( this.data[ i ] / 255 * Math.PI / 2 );

      if ( datum < .05 ) {
        r = 4 + 10 * datum;
        g = 4 + 10 * datum;
        b = 5 + 20 * datum;
      } else {
        let col;
        let colId;

        if ( datum < .08 ) { colId = 0; datum /= .08; }
        else if ( datum < .15 ) { colId = 1; datum /= .15; }
        else if ( datum < .17 ) { colId = 2; datum /= .17; }
        else if ( datum < .25 ) { colId = 3; datum /= .25; }
        else if ( datum < .3  ) { colId = 4; datum /= .3; }
        else if ( datum < .4  ) { colId = 5; datum /= .4; }
        else if ( datum < .6  ) { colId = 6; datum /= .6; }
        else if ( datum < .8  ) { colId = 7; datum /= .8; }
        else                    { colId = 8; }

        col = colors[ colId ];
        r = col[ 0 ] * datum;
        g = col[ 1 ] * datum;
        b = col[ 2 ] * datum;
      }

      this.data[ x     ] = Math.floor(r);
      this.data[ x + 1 ] = Math.floor(g);
      this.data[ x + 2 ] = Math.floor(b);
      this.data[ x + 3 ] = 255;
    }
  }
}

const colors = [
[   5,   2,  20 ], // 0
[   8,   5,  30 ], // 1
[  15,   7,  50 ], // 2
[  75,   7,  35 ], // 3
[  80,   0,   0 ], // 4
[ 180,   0,   0 ], // 5
[ 200,  25,  10 ], // 6
[ 200, 128,  10 ], // 7
[ 200, 200,  20 ], // 8
];
</script>

<style scoped lang="sass">
.myCanvas
  border: 1px solid #FFFFFF
  height: 75%
  width:  25%

</style>
