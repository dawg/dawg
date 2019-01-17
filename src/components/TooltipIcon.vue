<template>
  <div class="icon__wrapper">
    <v-tooltip :right="right" :left="left" :top="top" :bottom="bottom" z-index="100">
      <template slot="activator">
        <div @click="$emit('click', $event)">
          <icon v-if="fa" :name="icon" :style="style" v-bind="$attrs"></icon>
          <v-icon v-else :style="style" v-bind="$attrs">{{ icon }}</v-icon>
        </div>
      </template>
      <span>{{ tooltip }}</span>
    </v-tooltip>
    <slot v-if="false"></slot>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';

@Component
export default class TooltipIcon extends Vue {
  @Prop({ type: Boolean, default: false }) public fa!: boolean;
  @Prop({ type: Boolean, default: false }) public right!: boolean;
  @Prop({ type: Boolean, default: false }) public left!: boolean;
  @Prop({ type: Boolean, default: false }) public top!: boolean;
  @Prop({ type: Boolean, default: false }) public bottom!: boolean;
  @Prop({ type: String, required: true }) public tooltip!: boolean;
  @Prop({ type: String, default: 'white' }) public color!: boolean;

  get icon() {
    const slot = this.$slots.default;
    if (!slot || !slot[0]) {
      return '';
    }

    const text = slot[0].text || '';
    return text.trim();
  }

  get showTooltip() {
    return !!this.tooltip;
  }

  get style() {
    return { color: this.color };
  }
}
</script>

<style lang="sass" scoped>
.icon__wrapper:hover
  cursor: pointer
</style>