<template>
  <sequencer
    v-on="$listeners"
    v-bind="$attrs"
    :row-height="rowHeight"
    :num-rows="allKeys.length"
    :prototype.sync="note"
    :row-class="rowClass"
    name="Piano Roll"
  >
    <template slot="side">
      <piano 
        :synth="instrument"
        :key-height="rowHeight"
      ></piano>
    </template>
  </sequencer>
</template>

<script lang="ts">
import { Vue, Component, Prop, Inject } from 'vue-property-decorator';
import Sequencer from '@/modules/sequencer/Sequencer.vue';
import { allKeys, toTickTime } from '@/utils';
import { Note, Instrument, Element } from '@/schemas';

@Component({
  components: { Sequencer },
})
export default class PianoRollSequencer extends Vue {
  @Prop({ type: Object, required: true }) public instrument!: Instrument;
  @Prop({ type: Number, required: true }) public rowHeight!: number;

  public note = new Note({ row: -1, time: -1, duration: 1 }).init(this.instrument);
  public allKeys = allKeys;

  public rowClass(i: number) {
    const key = allKeys[i].value;
    return key.includes('#') ? 'secondary-darken-1' : 'secondary';
  }
}
</script>

<style lang="sass" scoped>

</style>