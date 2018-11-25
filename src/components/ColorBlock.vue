<template>
    <div id="el" ref="el" :class="[color, 'color-block']" :style="style">
        <p>{{ color }}</p>
        <p>{{ hex }}</p>
    </div>
</template>

<script lang="ts">
import tinycolor from 'tinycolor2';
import { Component, Vue, Prop } from 'vue-property-decorator';

@Component
export default class ColorBlock extends Vue {
  @Prop({ type: String, required: true }) public color!: string;
  public rgb: string | null = null;
  get tiny() {
    if (!this.rgb) { return null; }
    return tinycolor(this.rgb);
  }
  get style() {
    return {
      color: this.isLight ? '#000' : '#fff',
    };
  }
  get isLight() {
    return this.tiny && this.tiny.isLight();
  }
  get hex() {
    if (!this.tiny) { return null; }
    return '#' + this.tiny.toHex();
  }
  public mounted() {
    const el = this.$refs.el;
    if (!el || !(el instanceof Element)) { return; }
    this.rgb = window.getComputedStyle(el).backgroundColor;
  }
}
</script>

<style lang="scss" scoped>
.color-block {
  height: 40px;
  width: 220px;
  display: flex;
  justify-content: space-between;
  padding: 0 10px;
  padding-top: 10px;
}
</style>
