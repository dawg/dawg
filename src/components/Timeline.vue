<template>
  <div class="timeline secondary" @mousedown="mousedown">
      <div class="loop" :style="loopStyle" @mousedown="mousedown($event, 'center')">

        <!-- These are the blocks the catch the events. The little hover things are too small -->
        <div class="loopExt loopA" @mousedown="mousedown($event, 'start')"></div>
        <div class="loopExt loopB" @mousedown="mousedown($event, 'end')"></div>

        <!-- These next two elements are the little bars you see when you hover -->
        <div class="loopBrd loopBrdA"></div>
        <div class="loopBrd loopBrdB"></div>
        
        <div class="loopBg"></div>
      </div>
    <div 
      v-for="(step, i) in displaySteps"
      :key="i"
      :class="step.className"
      :style="{left: step.left}"
    >
      {{ step.textContent }}
    </div>
    <svg class="cursor" width="16" height="10" :style="cursorStyle">
      <polygon points="2,2 8,8 14,2"/>
    </svg>
</div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch, Mixins, Inject } from 'vue-property-decorator';
import { ResponsiveMixin, Directions } from '@/modules/resize';
import { Button } from '@/keys';
import { range, Nullable } from '@/utils';

@Component
export default class Timeline extends Mixins(ResponsiveMixin) {
  @Inject() public stepsPerBeat!: number;
  @Inject() public beatsPerMeasure!: number;
  @Inject() public pxPerBeat!: number;
  @Inject() public pxPerStep!: number;
  @Prop({ type: Number, required: true }) public value!: number;
  @Prop({ type: Number, required: true }) public loopStart!: number;
  @Prop({ type: Number, required: true }) public loopEnd!: number;
  @Prop(Nullable(Number)) public setLoopStart!: number;
  @Prop(Nullable(Number)) public setLoopEnd!: number;
  @Prop({ type: Number, default: 0 }) public offset!: number;
  @Prop({ type: String, default: 'step' }) public detail!: 'step' | 'beat' | 'measure';

  public steps: HTMLElement[] = [];
  public stepRound = 1;

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
      this.$emit('update:setLoopStart', null);
      this.$emit('update:setLoopEnd', null);
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

    const beatDiff = e.movementX / this.pxPerBeat;
    let start = this.start!;
    let end = this.end!;

    if (this.selectedStart || this.selectedEnd) {
      this.selectedStart ? start += beatDiff : end += beatDiff;

      if ( start > end ) {
        this.selectedStart = !this.selectedStart;
        this.selectedEnd = !this.selectedEnd;
      }
    } else {
      // else we are moving the loop
      start += beatDiff;
      end += beatDiff;
    }

    this.start = Math.max(0, Math.min(start, end));
    this.end = Math.max(0, start, end);
    this.displayStart = this.round(this.start);
    this.displayEnd = this.round(this.end);

    if (this.displayStart !== this.setLoopStart) {
      this.$emit('update:setLoopStart', this.displayStart);
    }

    if (this.displayEnd !== this.setLoopEnd) {
      this.$emit('update:setLoopEnd', this.displayEnd);
    }
  }

  // TODO Change this
  public round(value: number) {
    if (this.stepRound) {
      value = Math.round(value);
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
      left: this.progress,
    };
  }
  public get progress() {
    return this.beatToPx((this.loopEnd - this.loopStart) * this.value + this.loopStart);
  }

  public beatToPx(beat: number) {
    return (beat - this.offset) * this.pxPerBeat + 'px';
  }
  public getWidth() {
    return this.rendered ? this.$el.getBoundingClientRect().width : 0;
  }
  public get stepsPerMeasure() { return this.stepsPerBeat * this.beatsPerMeasure; }
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
      const className = isMeasure ? 'measure' : isBeat ? 'beat' : 'step';
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
	--loop-bg: tomato;
	--cursor-fill: yellow;
	--loopBorder-bg: yellow;
}

.timeline {
	position: relative;
	overflow: hidden;
	font: 14px monospace;
	color: rgb(180, 180, 180);
	cursor: default;
  border-bottom: 1px solid rgba(0, 0, 0, 0.5);
}

.loop {
	position: absolute;
	z-index: 1;
	height: 20%;
	top: 0;
}
.loopBg {
	position: absolute;
	width: 100%;
	height: 100%;
	background-color: var( --loop-bg );
	transition: filter .2s;
}
.loopBg:hover {
	filter: brightness( 1.2 );
}
.loopExt {
	position: absolute;
	z-index: 2;
	width: 25%;
	min-width: 5px;
	max-width: 10px;
	height: 250%;
}
.loopA { left: -5px; }
.loopB { right: -5px; }

.loopBrd {
	position: absolute;
	z-index: 0;
	width: 2px;
	height: 100%;
	background-color: var( --loop-bg );
	transition: .2s;
	transition-property: height, background-color, z-index;
}

.loopBrdA { left: -1px; }
.loopBrdB { right: -1px; }
.loopA:hover ~ .loopBrdA,
.loopB:hover ~ .loopBrdB {
	z-index: 1;
	height: 150%;
	background-color: var( --loopBorder-bg );
}

.cursor {
	position: absolute;
	margin-left: -8px;
	bottom: 1px;
	transition: left;
	fill: var( --cursor-fill );
	stroke: var( --cursor-fill );
	stroke-width: 2px;
	stroke-linejoin: round;
}


.measure, .beat, .step {
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

.measure {
	font-weight: bold;
}

.step {
	opacity: .2;
}

.beat {
	opacity: .5;
}
</style>