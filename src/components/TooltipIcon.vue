<template>
  <div class="icon__wrapper">
    <v-tooltip :right="right" :left="left" :top="top" :bottom="bottom" z-index="2000">
      <template slot="activator">
        <icon v-if="fa" :name="icon" :style="style" v-bind="$attrs"></icon>
        <v-icon v-else class="icon" :style="style" v-bind="$attrs">{{ icon }}</v-icon>
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

// IDK why we need this? It also hardcodes 28px which isn't good
// If you remove this, the patterns tooltip will be super weird...
.icon__wrapper /deep/ .v-icon
  max-width: 28px
</style>