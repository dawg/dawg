<template>
  <div class="channel">
    <div class="primary color"></div>
    <editable v-model="channel.name" class="secondary label"></editable>
    <ul>
      <li v-for="(effect, i) in effects" :key="i" class="slot" @click="showEffects($event, i)">
        <div v-if="effect" class="primary" style="height: 2px"></div>
        <div
          v-if="effect"
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
            v-model="channel.pan"
            stroke-class="secondary-lighten-2--stroke"
            :size="30"
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
          <slider v-model="channel.volume"></slider>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';
import Knob from '@/components/Knob.vue';
import Slider from '@/components/Slider.vue';
import { Channel as C, Effect, EffectMap, EffectName } from '@/schemas';
import { range } from '@/utils';

// Beware, we are modifying data in the store directly here.
// We will want to change this evetually.
@Component({
  components: { Knob, Slider },
})
export default class Channel extends Vue {
  @Prop({ type: Object, required: true }) public channel!: C;

  get effectLookup() {
    const o: { [k: number]: Effect } = {};
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

  public showEffects(e: MouseEvent, i: number) {
    const items = this.options.map((option) => ({ text: option, callback: () => this.addEffect(option, i) }));
    this.$context(e, items);
  }

  public addEffect(effect: EffectName, i: number) {
    this.$emit('add', { effect, index: i });
  }

  public mute() {
    this.channel.mute = !this.channel.mute;
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