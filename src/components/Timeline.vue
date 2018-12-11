<template>
  <div class="gsuiTimeline secondary-darken" @mousedown="mousedown">
    <div class="gsuiTimeline-loopLine">
      <div class="gsuiTimeline-loop" :style="loopStyle" @mousedown="mousedown($event, 'center')">

        <!-- These are the blocks the catch the events. The little hover things are too small -->
        <div class="gsuiTimeline-loopExt gsuiTimeline-loopA" @mousedown="mousedown($event, 'start')"></div>
        <div class="gsuiTimeline-loopExt gsuiTimeline-loopB" @mousedown="mousedown($event, 'end')"></div>

        <!-- These next two elements are the little bars you see when you hover -->
        <div class="gsuiTimeline-loopBrd gsuiTimeline-loopBrdA"></div>
        <div class="gsuiTimeline-loopBrd gsuiTimeline-loopBrdB"></div>
        
        <div class="gsuiTimeline-loopBg"></div>
      </div>
    </div>
    <svg class="gsuiTimeline-cursor" width="16" height="10" :style="cursorStyle">
      <polygon points="2,2 8,8 14,2"/>
    </svg>
    <div class="gsuiTimeline-currentTime"></div>
    <div 
      v-for="(step, i) in displaySteps"
      :key="i"
      :class="step.className"
      :style="{left: step.left}"
    >
      {{ step.textContent }}
    </div>
</div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch, Mixins } from 'vue-property-decorator';
import { ResponsiveMixin, Directions } from '@/modules/resize';
import { Button } from '@/keys';
import { range } from '@/utils';

@Component
export default class Timeline extends Mixins(ResponsiveMixin) {
  @Prop({ type: Number, required: true }) public value!: number;
  @Prop({ type: Number, default: 0 }) public offset!: number;
  @Prop({ type: Number, default: 80 }) public pxPerBeat!: number;
  @Prop({ type: String, default: 'step' }) public detail!: 'step' | 'beat' | 'measure';

  public steps: HTMLElement[] = [];
  public stepsPerBeat = 4;
  public beatsPerMeasure = 4;
  public stepRound = 1;
  public currentTime = 0;

  public start: number | null  = null;
  public displayStart: number | null  = null;
  public end: number | null = null;
  public displayEnd: number | null = null;
  public inLoop = false;
  public selectedStart = false;
  public selectedEnd = false;
  public rendered = false;

  public mousedown(e: MouseEvent, location?: 'start' | 'end' | 'center') {
    if (e.button !== Button.LEFT) { return; }

    e.preventDefault();
    if (!location) {
      this.start = null;
      this.end = null;
      this.inLoop = false;
    } else {
      this.selectedStart = location === 'start';
      this.selectedEnd = location === 'end';
      e.stopPropagation();
    }

    window.addEventListener('mousemove', this.mousemove);
    window.addEventListener('mouseup', this.removeMousemove);
  }
  public removeMousemove() {
    window.removeEventListener('mousemove', this.mousemove);
    window.removeEventListener('mouseup', this.removeMousemove);
  }
  public mousemove(e: MouseEvent) {
    if (!this.inLoop) {
      this.$log.info('Starting loop!');
      const left = this.$el.getBoundingClientRect().left;
      const position = (e.pageX - left) / this.pxPerBeat;
      this.inLoop = true;
      this.start = position;
      this.end = position;
      this.selectedEnd = true;
    }

    const bt = e.movementX / this.pxPerBeat;
    let start = this.start!;
    let end = this.end!;

    if (this.selectedStart || this.selectedEnd) {
      this.selectedStart ? start += bt : end += bt;

      if ( start > end ) {
        this.selectedStart = !this.selectedStart;
        this.selectedEnd = !this.selectedEnd;
      }
    } else {
      start += bt;
      end += bt;
    }

    this.start = Math.max(0, Math.min(start, end));
    this.end = Math.max(0, start, end);
    this.displayStart = this.round(this.start, 'round');
    this.displayEnd = this.round(this.end, 'round');
  }

  public round(value: number, mathFn: 'round' | 'floor' | 'ceil' ) {
    if ( this.stepRound ) {
      const mod = 1 / this.stepsPerBeat * this.stepRound;
      value = Math[mathFn](value / mod) * mod;
    }
    return value;
  }

  public get loopStyle() {
    if (this.inLoop) {
      const width = this.$el.getBoundingClientRect().width;
      return {
        display: 'block',
        left: ( this.displayStart! - this.offset ) * this.pxPerBeat + 'px',
        right: width - ( this.displayEnd! - this.offset ) * this.pxPerBeat + 'px',
      };
    } else {
      return {
        display: 'none',
      };
    }
  }
  public get cursorStyle() {
    return {
      left: this.beatToPx(this.currentTime),
    };
  }

  public beatToPx(beat: number) {
    return (beat - this.offset) * this.pxPerBeat + 'px';
  }
  public getWidth() {
    return this.rendered ? this.$el.getBoundingClientRect().width : 0;
  }
  public get stepsPerMeasure() { return this.stepsPerBeat * this.beatsPerMeasure; }
  public get pxPerStep() { return this.pxPerBeat / this.stepsPerBeat; }
  public get beatsPerStep() { return 1 / this.stepsPerBeat; }
  public get stepsDuration() { return Math.ceil(this.width / this.pxPerStep + 2); }
  public get displaySteps() {
    const stepOffset = Math.floor(this.offset * this.stepsPerBeat);
    let em = -this.offset % this.beatsPerStep;
    return range(this.stepsDuration).map((i) => {
      const step = stepOffset + i;
      const isBeat = !(step % this.stepsPerBeat);
      const isMeasure = !(step % this.stepsPerMeasure);
      const isStep = !isBeat && !isMeasure;
      const className = 'gsuiTimeline-' + ( isMeasure ? 'measure' : isBeat ? 'beat' : 'step');
      const left = em * this.pxPerBeat + 'px';
      const textContent = isStep ? '.' : Math.floor(1 + step / this.stepsPerBeat).toString();
      em += this.beatsPerStep;
      return {
        className,
        left,
        textContent,
      };
    });
  }

  public mounted() {
    this.rendered = true;
  }
}
</script>

<style>

:root {
	--gsuiTimeline-color: rgb(180, 180, 180);
	--gsuiTimeline-loop-bg: tomato;
	--gsuiTimeline-cursor-fill: yellow;
	--gsuiTimeline-loopBorder-bg: yellow;
}

.gsuiTimeline {
	position: relative;
	overflow: hidden;
	font: 14px monospace;
	color: var( --gsuiTimeline-color );
	cursor: default;
}

/* .......................................................................... */
.gsuiTimeline-loopLine,
.gsuiTimeline-currentTime {
	position: absolute;
	z-index: 1;
	width: 100%;
	height: 50%;
	transition: .2s background-color;
}
.gsuiTimeline-loopLine:hover,
.gsuiTimeline-currentTime:hover {
	background-color: rgba( 255, 255, 255, .05 );
}
.gsuiTimeline-currentTime {
	bottom: 0;
}

/* .......................................................................... */
.gsuiTimeline-loop {
	position: absolute;
	z-index: 1;
	height: 40%;
	top: 0;
}
.gsuiTimeline-loopBg {
	position: absolute;
	width: 100%;
	height: 100%;
	background-color: var( --gsuiTimeline-loop-bg );
	transition: filter .2s;
}
.gsuiTimeline-loopBg:hover,
.gsuiTimeline-loopBg.gsui-hover {
	filter: brightness( 1.2 );
}
.gsuiTimeline-loopExt {
	position: absolute;
	z-index: 2;
	width: 25%;
	min-width: 5px;
	max-width: 10px;
	height: 250%;
}
.gsuiTimeline-loopA { left: -5px; }
.gsuiTimeline-loopB { right: -5px; }

.gsuiTimeline-loopBrd {
	position: absolute;
	z-index: 0;
	width: 2px;
	height: 100%;
	background-color: var( --gsuiTimeline-loop-bg );
	transition: .2s;
	transition-property: height, background-color, z-index;
}

.gsuiTimeline-loopBrdA { left: -1px; }
.gsuiTimeline-loopBrdB { right: -1px; }
.gsuiTimeline-loopA:hover ~ .gsuiTimeline-loopBrdA,
.gsuiTimeline-loopB:hover ~ .gsuiTimeline-loopBrdB,
.gsuiTimeline-loopBrd.gsui-hover {
	z-index: 1;
	height: 150%;
	background-color: var( --gsuiTimeline-loopBorder-bg );
}

.gsuiTimeline-cursor {
	position: absolute;
	margin-left: -8px;
	bottom: 1px;
	transition: left;
	fill: var( --gsuiTimeline-cursor-fill );
	stroke: var( --gsuiTimeline-cursor-fill );
	stroke-width: 2px;
	stroke-linejoin: round;
}


.gsuiTimeline-measure,
.gsuiTimeline-beat,
.gsuiTimeline-step {
	position: absolute;
	display: flex;
	top: 0;
	bottom: 0;
	width: 4em;
	margin-left: -2em;
	align-items: center;
	justify-content: center;
	user-select: none;
}

.gsuiTimeline-measure {
	font-weight: bold;
}

.gsuiTimeline-step {
	opacity: .2;
}

.gsuiTimeline-beat {
	opacity: .5;
}
</style>