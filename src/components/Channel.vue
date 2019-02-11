<template>
  <div class="channel">
    <div class="primary color"></div>
    <editable v-model="channel.name" class="secondary label"></editable>
    <ul>
      <li v-for="(effect, i) in effects" :key="i" class="slot" @click="showEffects($event, i)">
        <div v-if="effect" class="primary" style="height: 2px"></div>
        <div
          v-if="effect"
          @click="select($event, effect)"
          @contextmenu="contextmenu($event, effect)"
          class="effect secondary white--text"
        >
          {{ effect.type }}
        </div>
        <v-icon 
          v-else
          size="13px" 
          class="close-icon"
        >
          add
        </v-icon>
      </li>
    </ul>
    <div class="spacer"></div>
    <div class="controls">
      <div style="display: flex">
        <div style="display: flex; flex-direction: column; align-items: center">
          <pan
            :value="pan"
            @input="panInput"
            stroke-class="secondary-lighten-2--stroke"
            :size="30"
            @automate="automatePan"
          ></pan>
          <div style="flex-grow: 1"></div>
          <div 
            class="mute white--text"
            :class="{ 'primary-lighten-2': !channel.mute }"
            @click="mute"
          >
            {{ channel.number }}
          </div>
        </div>
        <div class="slider" style="display: flex">
          <slider 
            :value="volume"
            @input="volumeInput"
            :left="left" 
            :right="right"
            @automate="automateVolume"
          ></slider>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';
import { Channel as C, EffectMap, EffectName, AnyEffect } from '@/schemas';
import { range, scale, clamp } from '@/utils';
import { Watch } from '@/modules/update';

// Beware, we are modifying data in the store directly here.
// We will want to change this evetually.
@Component
export default class Channel extends Vue {
  @Prop({ type: Object, required: true }) public channel!: C;
  @Prop({ type: Boolean, required: true }) public play!: boolean;

  public right = 0;
  public left = 0;

  get effectLookup() {
    const o: { [k: number]: AnyEffect } = {};
    this.channel.effects.forEach((effect) => {
      o[effect.slot] = effect;
    });
    return o;
  }

  get effects() {
    return range(10).map((i) => this.effectLookup[i]);
  }

  get options() {
    return Object.keys(EffectMap) as EffectName[];
  }

  get pan() {
    return this.channel.panner.raw;
  }

  get volume() {
    return scale(this.channel.volume.raw, [0, 1.3], [0, 1]);
  }

  public showEffects(e: MouseEvent, i: number) {
    const items = this.options.map((option) => ({ text: option, callback: () => this.addEffect(option, i) }));
    this.$menu(e, items);
  }

  public addEffect(effect: EffectName, i: number) {
    this.$emit('add', { effect, index: i });
  }

  public select(e: MouseEvent, effect: AnyEffect) {
    e.stopPropagation();
    this.$emit('select', effect);
  }

  public contextmenu(e: MouseEvent, effect: AnyEffect) {
    this.$context(e, [{
      text: 'Delete',
      callback: () => this.$emit('delete', effect),
    }]);
  }

  public mute() {
    this.channel.mute = !this.channel.mute;
  }

  public process(level: number) {
    return clamp(scale(level, [-100, 6], [0, 1]), 0, 1);
  }

  public renderMeter() {
    if (this.play) {
      requestAnimationFrame(this.renderMeter);
      this.left = this.process(this.channel.left.getLevel());
      this.right = this.process(this.channel.right.getLevel());
    } else {
      this.left = 0;
      this.right = 0;
    }
  }

  public automatePan() {
    this.$automate(this.channel, 'panner');
  }

  public automateVolume() {
    this.$automate(this.channel, 'volume');
  }

  public panInput(value: number) {
    this.channel.panner.value = value;
  }

  public volumeInput(value: number) {
    this.channel.volume.value = scale(value, [0, 1], [0, 1.3]);
  }

  @Watch<Channel>('play')
  public start() {
    if (this.play) {
      this.renderMeter();
    }
  }
}
</script>

<style lang="sass" scoped>
$dark: #282c34
$between: #26282b
$light: #767a82

ul
  list-style: none
  padding-left: 0

.color
  height: 5px

.label
  height: 30px
  line-height: 30px
  color: white
  text-align: center
  vertical-align: text-bottom

.channel
  width: 100px
  min-height: 100%
  height: initial
  display: inline-block
  border-right: solid 1px $dark
  margin-bottom: 10px

.slot
  height: 25px
  border-top: solid 1px $between
  position: relative

  &:hover
    cursor: pointer
    background-color: darken($light, 2%)

    .close-icon
      transform: scale(1)
      transition-duration: .1s

  &:last-of-type
    border-bottom: solid 1px $between

.close-icon
  right: 0.5em
  z-index: 2
  width: 1.5em
  height: 1.5em
  line-height: 1.5
  text-align: center
  border-radius: 3px
  overflow: hidden
  transform: scale(0)
  transition: transform .08s
  position: absolute

.controls
  padding: 10px

.mute
  height: 40px
  background-color: #333
  line-height: 40px
  text-align: center
  width: 40px
  user-select: none

  &:hover
    cursor: pointer

.slider
  margin-left: 10px

.effect
  height: 23px
  line-height: 23px
  width: 100%
  text-align: center
</style>