<template>
  <div class="inline-block border-r border-default-darken-3">
    <div class="bg-primary" style="height: 5px"></div>
    <editable
      v-model="channel.name" 
      class="bg-default text-center text-default"
      style="line-height: 30px"
    ></editable>
    <ul>
      <li
        v-for="(effect, i) in effects"
        :key="i"
        class="group border-t last:border-b relative border-default-darken-2 cursor-pointer hover:bg-default-lighten-5"
        style="height: 25px"
        @click="showEffects($event, i)"
      >
        <div v-if="effect" class="bg-primary" style="height: 2px"></div>
        <div
          v-if="effect"
          @click="select($event, effect)"
          @contextmenu="contextmenu($event, effect)"
          class="bg-default text-default text-center truncate select-none"
          style="line-height: 23px"
        >
          {{ effect.type | sentenceCase }}
        </div>
        <dg-mat-icon
          v-else
          icon="add"
          class="right-0 pr-2 absolute z-10 text-sm group-hover:block hidden"
          style="line-height: 23px"
        ></dg-mat-icon>
      </li>
    </ul>
    <div class="spacer"></div>
    <div class="p-2">
      <div class="flex">
        <div class="flex flex-col items-center">
          <pan
            v-model="channel.pan.value"
            stroke-class="fg-default-lighten-2"
            :size="30"
            @automate="automatePan"
          ></pan>
          <div style="flex-grow: 1"></div>
          <div 
            class="mute text-default text-center select-none cursor-pointer"
            :class="{ 'bg-primary-lighten-1': !channel.mute.value, 'bg-primary-darken-3': channel.mute.value }"
            style="line-height: 40px; width: 40px"
            @click="channel.mute.value = !channel.mute.value"
          >
            {{ channel.number }}
          </div>
        </div>
        <div class="ml-4 flex">
          <slider 
            v-model="channel.volume.value"
            :left="left"
            :right="right"
            :to-gain="percentageToGain"
            :from-gain="gainToPercentage"
            @automate="automateVolume"
          ></slider>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { range, scale, clamp } from '@/lib/std';
import * as framework from '@/lib/framework';
import { ref, computed, watch, createComponent } from '@vue/composition-api';
import { EffectDefaults, Channel as C, AnyEffect, EffectName } from '@/models';
import { percentageToGain, gainToPercentage } from '@/models/volume';

function sentenceCase(text: string) {
  // const result = text.replace( /([A-Z])/g, ' $1' );
  // return result.charAt(0).toUpperCase() + result.slice(1);
  return text;
}

// Beware, we are modifying data in the store directly here.
// We will want to change this evetually.
export default createComponent({
  name: 'Channel',
  filters: {
    sentenceCase,
  },
  props: {
    channel: { type: Object as () => C, required: true },
    play: { type: Boolean, required: true },
  },
  setup(props, context) {
    const right = ref(0);
    const left = ref(0);

    const effectLookup = computed(() => {
      const o: { [k: number]: AnyEffect } = {};
      props.channel.effects.forEach((effect) => {
        o[effect.slot] = effect;
      });
      return o;
    });

    const effects = computed(() => {
      return range(10).map((i) => effectLookup.value[i]);
    });

    const options = computed(() => {
      return Object.keys(EffectDefaults) as EffectName[];
    });

    function showEffects(event: MouseEvent, i: number) {
      const items = options.value.map((option) => ({
        text: sentenceCase(option),
        callback: () => {
          addEffect(option, i);
        },
      }));

      framework.menu({
        position: event,
        items,
      });
    }

    function addEffect(effect: EffectName, i: number) {
      props.channel.addEffect(effect, i);
    }

    function select(event: MouseEvent, effect: AnyEffect) {
      event.stopPropagation();
      context.emit('select', effect);
    }

    function contextmenu(event: MouseEvent, effect: AnyEffect) {
      framework.context({
        position: event,
        items: [{
          text: 'Delete',
          callback: () => {
            const i = props.channel.effects.indexOf(effect);
            props.channel.deleteEffect(i);
          },
        }],
      });
    }

    function process(level: number) {
      return clamp(scale(level, [-100, 6], [0, 1]), 0, 1);
    }

    function renderMeter() {
      if (props.play) {
        requestAnimationFrame(renderMeter);
        left.value = process(props.channel.left.node.getValue());
        right.value = process(props.channel.right.node.getValue());
      } else {
        left.value = 0;
        right.value = 0;
      }
    }

    function automatePan() {
      // context.root.$automate(props.channel, 'panner');
    }

    function automateVolume() {
      // context.root.$automate(props.channel, 'volume');
    }

    watch(() => props.play, () => {
      if (props.play) {
        renderMeter();
      }
    });

    return {
      showEffects,
      automatePan,
      automateVolume,
      contextmenu,
      effects,
      left,
      right,
      select,
      percentageToGain,
      gainToPercentage,
    };
  },
});
</script>
