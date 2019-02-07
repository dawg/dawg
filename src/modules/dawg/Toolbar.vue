<template>
  <v-toolbar 
    class="secondary toolbar" 
    :height="height" 
  >
    <v-btn icon><ico fa scale="2">circle-notch</ico></v-btn>
    <h1 class="white--text">Vusic</h1>
    <div style="border-left: 1px solid #fff; height: 60%; margin: 20px"></div>
    

    <time-display :raw="seconds"></time-display>
    <bpm :value="bpm" @input="updateBpm"></bpm>

    <v-spacer></v-spacer>

    <v-btn icon style="margin: 0" @click="toggle">
      <icon :name="icon" class="white--text"></icon>
    </v-btn>
    <v-btn icon style="margin: 0"><ico fa>stop</ico></v-btn>
    <vertical-switch :top.sync="sliderTop"></vertical-switch>

  </v-toolbar>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import Bpm from '@/components/Bpm.vue';
import TimeDisplay from '@/components/TimeDisplay.vue';
import { Watch } from '@/modules/update';
import { Element } from '@/schemas';
import Transport from '@/modules/audio/transport';
import { ApplicationContext } from '@/constants';
import { Nullable } from '@/utils';

@Component({
  components: { TimeDisplay, Bpm },
})
export default class Toolbar extends Vue {
  @Prop(Number) public height!: number;
  @Prop(Number) public offset!: number;
  @Prop({ type: String, required: true }) public context!: ApplicationContext;
  @Prop({ type: Number, required: true }) public bpm!: number;
  @Prop({ type: Boolean, required: true }) public play!: boolean;
  @Prop(Nullable(Object)) public part!: Transport | null;

  public seconds = 0;
  public sliderTop = false;

  get icon() {
    return this.play ? 'pause' : 'play';
  }

  public toggle() {
    this.$update('play', !this.play);
  }

  public updateBpm(value: number) {
    this.$update('bpm', value);
  }

  public update() {
    if (!this.part) {
      this.seconds = 0;
      return;
    }

    if (this.part.state === 'started') { requestAnimationFrame(this.update); }
    this.seconds = this.part.seconds;
  }

  @Watch<Toolbar>('play')
  public startClock() {
    if (this.play) {
      this.update();
    }
  }

  @Watch<Toolbar>('sliderTop', { immediate: true })
  public switchContext() {
    if (this.sliderTop) {
      this.$update('context', 'playlist');
    } else {
      this.$update('context', 'pianoroll');
    }
  }
}
</script>

<style scoped lang="sass">
.toolbar
  border-bottom: 1px solid
  padding: 0

.clock
  font-size: 30px
  font-family: var(--monospace)
  margin-left: 10px
  padding: 0.2em .3em 0 .3em
  border: 3px solid rgba(0,0,0,.3)
  background-color: #222
  filter: none
  display: flex
  align-items: baseline
  box-sizing: border-box
  line-height: 1em

.second, .small-text
  margin-left: 5px

.small-text
  font-size: .5em

.toolbar
  box-shadow: none
</style>
