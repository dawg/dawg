<template>
  <v-btn icon @click="handleClick">
    <icon name="circle" scale="0.4" :color="color"></icon>
  </v-btn>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

@Component
export default class DotButton extends Vue {
  public active = true;

  public handleClick() {
    this.active = !this.active;
    this.$emit('click');
  }

  get color() {
    if (this.active) {
      return '#00ff51';
    }

    return null;
  }
}
</script>
