<template>
  <sequencer
    v-on="$listeners"
    v-bind="$attrs"
    :row-height="noteHeight"
    :num-rows="allKeys.length"
    :prototype.sync="note"
    :row-class="rowClass"
  >
    <template slot="side">
      <piano :synth="instrument"></piano>
    </template>
  </sequencer>
</template>

<script lang="ts">
import { Vue, Component, Prop, Inject } from 'vue-property-decorator';
import Sequencer from '@/modules/sequencer/Sequencer.vue';
import { allKeys } from '@/utils';
import { Note, Instrument } from '@/schemas';
import Part from '@/modules/audio/part';

@Component({
  components: { Sequencer },
})
export default class PianoRollSequencer extends Vue {
  @Inject() public noteHeight!: number;
  @Inject() public pxPerBeat!: number;

  @Prop({ type: Object, required: true }) public instrument!: Instrument;
  
  public note = new Note({ row: -1, time: -1, duration: 1 });
  public allKeys = allKeys;

  public rowClass(i: number) {
    const key = allKeys[i].value;
    return key.includes('#') ? 'secondary-darken-1' : 'secondary';
  }
}
</script>

<style lang="sass" scoped>

</style>