<template>
  <div
    ref="el"
    class="
      bg-default
      text-default
      relative
      overflow-hidden
      border-solid
      text-sm
      border-b
      border-default-darken-1
    " 
    @dblclick="remove"
    @mousedown="mousedown"
    @contextmenu="disable"
  >
      <div 
        class="absolute top-0 z-10" 
        style="height: 2px" 
        :style="loopStyle" 
        @mousedown="mousedown($event, 'center')"
      >
        <div class="relative h-full w-full bg-primary-lighten-3">
          <div 
            class="loop-end left-0 cursor-pointer w-1 h-1 absolute bg-primary-lighten-3 z-10"
            @mousedown="mousedown($event, 'start')"
          ></div>
          <div 
            class="loop-end right-0 cursor-pointer w-1 h-1 absolute bg-primary-lighten-3 z-10" 
            @mousedown="mousedown($event, 'end')"
          ></div>
        </div>
        </div>
    <div 
      v-for="(step, i) in displaySteps"
      :key="i"
      :class="step.className"
      :style="{left: step.left}"
    >
      {{ step.textContent }}
    </div>
    <progression
      :position="cursorPosition"
      :loop-end="loopEnd"
      :loop-start="loopStart"
      :scroll-left="scrollLeft"
      :px-per-beat="pxPerBeat"
      class="cursor-progress"
    >
      <svg class="cursor" width="16" height="10">
        <polygon points="2,2 8,8 14,2"/>
      </svg>
    </progression>
</div>
</template>

<script lang="ts">
import { Directions, Nullable, useResponsive, update } from '@/lib/vutils';
import { range, Mouse } from '@/lib/std';
import * as dawg from '@/dawg';
import { createComponent, computed, ref, watch } from '@vue/composition-api';
import { addEventListeners } from '../lib/events';
import { calculateSimpleSnap, doSnap } from '@/utils';

type Location = 'start' | 'end' | 'center';

export default createComponent({
  props: {
    stepsPerBeat: { type: Number, required: true },
    beatsPerMeasure: { type: Number, required: true },
    pxPerBeat: { type: Number, required: true },
    cursorPosition: { type: Number, required: true },
    loopStart: { type: Number, required: true },
    loopEnd: { type: Number, required: true },
    scrollLeft: { type: Number, default: 0 },
    minSnap: { type: Number, required: true },
    snap: { type: Number, required: true },
    detail: { type: String as () => 'step' | 'beat' | 'measure', default: 'step' },
    setLoopStart: { type: Number, required: false },
    setLoopEnd: { type: Number, required: false },
  },
  setup(props, context) {
    const { width, height, observe } = useResponsive();

    const el = ref<Element>();
    watch(el, () => {
      if (el.value) {
        observe(el.value);
      }
    });

    const pxPerStep = computed(() => {
      return props.pxPerBeat / props.stepsPerBeat;
    });

    const stepsPerMeasure = computed(() => {
      return props.stepsPerBeat * props.beatsPerMeasure;
    });

    const beatsPerStep = computed(() => {
      return 1 / props.stepsPerBeat;
    });

    const stepsDuration = computed(() => {
      return Math.ceil(width.value / pxPerStep.value + 2);
    });

    const displayStep = computed(() => {
      return props.pxPerBeat > 40;
    });

    const displayBeat = computed(() => {
      return props.pxPerBeat > 20;
    });

    const beatOffset = computed(() => {
      return props.scrollLeft / props.pxPerBeat;
    });

    const stepOffset = computed(() => {
      return props.scrollLeft / pxPerStep.value;
    });

    const displaySteps = computed(() => {
      const stepOffsetFloored = Math.floor(props.scrollLeft / pxPerStep.value);

      let em = -beatOffset.value % beatsPerStep.value;
      return range(stepsDuration.value).map((i) => {
        const step = stepOffsetFloored + i;
        const isBeat = !(step % props.stepsPerBeat);
        const isMeasure = !(step % stepsPerMeasure.value);
        const isStep = !isBeat && !isMeasure;
        const className = isMeasure ? 'measure' : isBeat ? 'beat' : 'step';
        const left = em * props.pxPerBeat + 'px';
        let textContent: string;

        if (isStep) {
          if (displayStep.value) {
            textContent = '.';
          } else {
            textContent = '';
          }
        } else {
          if (isBeat && !isMeasure && !displayBeat.value) {
            textContent = '';
          } else {
            textContent = Math.floor(1 + step / props.stepsPerBeat).toString();
          }
        }

        em += beatsPerStep.value;
        return {
          className,
          left,
          textContent,
        };
      });
    });

    const loopStyle = computed(() => {
      if (!el.value || props.setLoopStart === undefined || props.setLoopEnd === undefined) {
        return {
          display: 'none',
        };
      }

      const rect = el.value.getBoundingClientRect();
      return {
        display: 'block',
        left: (props.setLoopStart - beatOffset.value) * props.pxPerBeat + 'px',
        right: rect.width - (props.setLoopEnd - beatOffset.value) * props.pxPerBeat + 'px',
      };
    });

    function remove() {
      update(props, context, 'setLoopStart', undefined);
      update(props, context, 'setLoopEnd', undefined);
    }

    function disable(e: MouseEvent) {
      e.preventDefault();
    }

    function mousedown(e: MouseEvent, location?: Location) {
      e.stopImmediatePropagation();

      if (location || e.button === Mouse.RIGHT) {
        const rect = el.value?.getBoundingClientRect();

        const beat = doSnap({
          position: e.clientX,
          offset: rect?.left ?? 0,
          scroll: props.scrollLeft,
          altKey: e.altKey,
          snap: props.snap,
          minSnap: props.minSnap,
          pxPerBeat: props.pxPerBeat,
          round: Math.round,
        });

        dragContext = { beat, location: location ?? 'end' };

        // If there already is a location that means that we are already in a loop
        if (!location) {
          update(props, context, 'setLoopStart', beat);
          update(props, context, 'setLoopEnd', beat);
        }

        const d2 = addEventListeners({
          mousemove,
          mouseup: () => {
            if (props.setLoopStart === props.setLoopEnd) {
              remove();
            }

            d2.dispose();
          },
        });
      } else if (e.button === Mouse.LEFT) {
        seek(e);
        const d1 = addEventListeners({
          mousemove: seek,
          mouseup: () => {
            d1.dispose();
          },
        });
      }
    }

    function seek(e: MouseEvent) {
      const beat = Math.min(getPosition(e), props.loopEnd);
      context.emit('seek', beat);
    }

    function getPosition(e: MouseEvent) {
      const rect = el.value?.getBoundingClientRect();
      const value = doSnap({
        position: e.clientX,
        offset: rect?.left ?? 0,
        scroll: props.scrollLeft,
        altKey: false, // irrelevant
        snap: props.minSnap,
        minSnap: props.minSnap,
        pxPerBeat: props.pxPerBeat,
      });

      return Math.max(0, value);
    }

    let dragContext: { beat: number, location: Location } | undefined;
    function mousemove(e: MouseEvent) {
      if (
        dragContext === undefined ||
        props.setLoopStart === undefined ||
        props.setLoopEnd === undefined
      ) {
        return;
      }

      const rect = el.value?.getBoundingClientRect();
      const beat = doSnap({
        position: e.clientX,
        offset: rect?.left ?? 0,
        scroll: props.scrollLeft,
        altKey: e.altKey,
        snap: props.snap,
        minSnap: props.minSnap,
        pxPerBeat: props.pxPerBeat,
        round: Math.round,
      });

      const { beat: initialBeat, location } = dragContext;
      const beatDiff = beat - initialBeat;

      // First, let's check the bounds
      if (
        (location === 'start' || location === 'center') &&
        props.setLoopStart + beatDiff < 0
      ) {
        return;
      }

      let setLoopStart = props.setLoopStart;
      if (location === 'start' || location === 'center') {
        setLoopStart += beatDiff;
      }

      let setLoopEnd = props.setLoopEnd;
      if (location === 'end' || location === 'center') {
        setLoopEnd += beatDiff;
      }

      if (setLoopStart > setLoopEnd) {
        dragContext.location = location === 'start' ? 'end' : 'start';
        const temp = setLoopStart;
        setLoopStart = setLoopEnd;
        setLoopEnd = temp;
      }

      dragContext.beat = beat;
      update(props, context, 'setLoopStart', setLoopStart);
      update(props, context, 'setLoopEnd', setLoopEnd);
    }

    function getWidth() {
      return el.value?.getBoundingClientRect().width ?? 0;
    }

    return {
      el,
      remove,
      mousedown,
      disable,
      loopStyle,
      displaySteps,
    };
  },
});
</script>

<style lang="scss">
.loop-end {
  width: 6px;
  height: 4px;
  opacity: 0;
  
  transition: .2s;
  transition-property: opacity;

  &:hover {
    opacity: 1;
  }
}

.cursor-progress {
  margin-left: -8px;
	bottom: 1px;
	transition: left;
}

.cursor {
	fill: yellow;
	stroke: yellow;
	stroke-width: 2px;
	stroke-linejoin: round;
  /* IDK why but float right pushes the element to the bottom */
  float: right;
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