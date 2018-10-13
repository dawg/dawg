<template>
  <v-list dense style="padding: 0">
    <template v-for="(instrument, index) in instruments">
      <v-list-tile @click="clicked" :key="instrument">
        <v-list-tile-content>
          <v-list-tile-title>{{ instrument }}</v-list-tile-title>
        </v-list-tile-content>
        <v-list-tile-action>
          <dot-button @click="handle(instrument)"></dot-button>
        </v-list-tile-action>
      </v-list-tile>
      <v-divider :key="`divider-${instrument}`" v-if="index !== instruments.length - 1"></v-divider>
    </template>
  </v-list>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import DotButton from '@/components/DotButton.vue';

@Component({
  components: { DotButton },
})
export default class ChannelRack extends Vue {
  @Prop({ type: Array, required: true }) public instruments!: string[];
  public disabled = new Set<string>();
  public handle(instrument: string) {
    if (instrument in this.disabled) {
      this.disabled.delete(instrument);
    } else {
      this.disabled.add(instrument);
    }
  }
  public clicked() {
    this.$emit('click');
  }
}
</script>