<template>
  <v-btn icon @click="thing" class="dot-button">
    <icon name="circle" scale="0.4" :class="color"></icon>
  </v-btn>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator';

@Component
export default class DotButton extends Vue {
  @Prop({type: Boolean, required: true}) public value!: boolean;

  get color() {
    if (this.value) {
      return 'primary--text';
    } else {
      return 'background--text';
    }
  }

  public thing(e: MouseEvent) {
    e.stopPropagation();
    this.$emit('input', !this.value);
  }
}
</script>

<style lang="sass" scoped>
.dot-button
  height: 20px
  width: 20px
  margin: 5px
</style>
