<template>
  <v-btn icon @click="thing">
    <icon name="circle" scale="0.4" :class="{'primary--text': value}"></icon>
  </v-btn>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator';

@Component
export default class DotButton extends Vue {
  @Prop({type: Boolean, required: true}) public value!: boolean;

  public thing(e: MouseEvent) {
    e.stopPropagation();
    this.$emit('input', !this.value);
  }
}
</script>
