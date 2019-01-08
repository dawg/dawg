<template>
  <div class="icon__wrapper">
    <v-tooltip v-if="showTooltip" :right="right" :left="left" :top="top" :bottom="bottom">
      <template slot="activator">
        <v-btn icon @click="$emit('click', $event)">
          <icon v-if="fa" :name="icon" :style="style"></icon>
          <v-icon v-else :style="style">{{ icon }}</v-icon>
        </v-btn>
      </template>
      <span>{{ tooltip }}</span>
    </v-tooltip>
    <v-btn icon v-else @click="$emit('click', $event)">
      <icon v-if="fa" :name="icon" :style="style"></icon>
      <v-icon v-else :style="style">{{ icon }}</v-icon>
    </v-btn>
    <slot v-if="false"></slot>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';

@Component
export default class NAME extends Vue {
  @Prop({ type: Boolean, default: false }) public fa!: boolean;
  @Prop({ type: Boolean, default: false }) public right!: boolean;
  @Prop({ type: Boolean, default: false }) public left!: boolean;
  @Prop({ type: Boolean, default: false }) public top!: boolean;
  @Prop({ type: Boolean, default: false }) public bottom!: boolean;
  @Prop(String) public tooltip!: boolean;
  @Prop({ type: String, default: 'white' }) public color!: boolean;

  get icon() {
    const text = (this.$slots.default[0] || {}).text || '';
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

</style>