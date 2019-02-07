<template>
  <div class="phaser secondary">
    <div class="title white--text">{{ name | upper }}</div>
    <div style="display: flex; flex-direction: column">
      <knob
        class="option"
        v-for="key in keys"
        :key="key"
        :label="key | titleCase"
        stroke-class="secondary-lighten-2--stroke"
        :value="options[key]"
        @input="$emit('set', { key, value: $event })"
        :min="constraints(key).min"
        :max="constraints(key).max"
        :size="size"
        @automate="automate(key)"
      ></knob>
    </div>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';
import {
  EffectConstrains,
  EffectName,
  Effect as E,
  AnyEffect,
  EffectOptions,
  EffectConstrainsType,
} from '@/schemas';

@Component({
  filters: {
    titleCase(text: string) {
      const result = text.replace( /([A-Z])/g, ' $1' );
      return result.charAt(0).toUpperCase() + result.slice(1);
    },
    upper(text: string) {
      return text.toUpperCase();
    },
  },
})
export default class Effect<T extends EffectName> extends Vue {
  @Prop({ type: Object, required: true }) public effect!: E<T>;
  public size = 30;

  get name() {
    return this.effect.type;
  }

  get options() {
    return this.effect.options;
  }

  get keys() {
    return Object.keys(this.options);
  }

  public constraints(name: keyof EffectConstrainsType[T]) {
    return EffectConstrains[this.effect.type][name];
  }

  public automate(key: keyof E<T>['options']) {
    // TODO(jacob)
    // this.$automate(this.effect.options, key);
  }
}
</script>

<style lang="sass" scoped>
.title
  font-size: 30px
  margin: 0 0 15px

.phaser
  margin: 5px
  padding: 9px 5px
  border-radius: 5px
  text-align: center

.option
  margin: 5px
</style>