<template>
  <div class="effect bg-default">
    <div class="title text-default">{{ name | upper }}</div>
    <div style="display: flex; flex-direction: column">
      <knob
        class="option"
        v-for="key in keys"
        :name="key"
        :key="key"
        :label="key | titleCase"
        stroke-class="fg-default-lighten-2"
        :value="options[key]"
        @input="effect.set({ key, value: $event })"
        :min="constraints(key).min"
        :max="constraints(key).max"
        :size="size"
        disable-automation
      ></knob>
      <knob
        class="option"
        name="Wet"
        label="Wet"
        stroke-class="fg-default-lighten-2"
        v-model="effect.wet.value"
        :min="0"
        :max="1"
        :size="size"
        disable-automation      
      ></knob>
    </div>
  </div>
</template>

<script lang="ts">
import { EffectName } from '@/models/filters/effects';
import { EffectConstrainsType, EffectConstrains } from '@/models/filters/bounds';
import { Effect as E } from '@/models/filters/effect';
import { computed, createComponent } from '@vue/composition-api';

export default createComponent({
  name: 'Effect',
  filters: {
    titleCase(text: string) {
      const result = text.replace( /([A-Z])/g, ' $1' );
      return result.charAt(0).toUpperCase() + result.slice(1);
    },
    upper(text: string) {
      return text.toUpperCase();
    },
  },
  props: {
    effect: { type: Object as () => E<EffectName>, required: true },
  },
  setup(props) {
    const size = 30;

    const name = computed(() => {
      return props.effect.type;
    });

    const options = computed(() => {
      return props.effect.options;
    });

    const keys = computed(() => {
      return Object.keys(options.value);
    });

    function constraints(n: keyof EffectConstrainsType[EffectName]) {
      return EffectConstrains[props.effect.type][n];
    }

    return {
      name,
      options,
      keys,
      constraints,
    };
  },
});
</script>

<style lang="sass" scoped>
.title
  font-size: 30px
  margin: 0 0 15px

.effect
  margin: 5px
  padding: 9px 5px
  border-radius: 5px
  text-align: center

.option
  margin: 5px
</style>