<template>
  <sequencer
    v-on="$listeners"
    v-bind="$attrs"
    :row-height="noteHeight"
    :num-rows="allKeys.length"
    :create-class="Note"
    :row-class="rowClass"
  ></sequencer>
</template>

<script lang="ts">
import { Vue, Component, Prop, Inject } from 'vue-property-decorator';
import Sequencer from '@/modules/sequencer/Sequencer.vue';
import { allKeys } from '@/utils';
import { Note } from '@/schemas';

@Component({
  components: { Sequencer },
})
export default class PianoRollSequencer extends Vue {
  @Inject() public noteHeight!: number;
  public note = new Note();
  public allKeys = allKeys;
  public rowClass(i: number) {
    const key = allKeys[i].value;
    return key.includes('#') ? 'secondary-darken-1' : 'secondary';
  }
}
</script>

<style lang="sass" scoped>

</style>