<template>
  <sequencer
    :row-style="rowStyle"
    @add="add"
  >

  </sequencer>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';
import { allKeys } from '@/utils';
import { Note } from '@/schemas';

@Component
export default class P extends Vue {
  @Prop({ type: Array, required: true }) public value!: Note[];
  // selected[i] indicates whether value[i] is selected
  public selected: boolean[] = [];
  public numRows = allKeys.length;

  public rowStyle(row: number) {

  }

  /**
   * Add a note.
   */
  public add(e: MouseEvent, row: number, time: number) {
    const note = {
      duration: this.default,
      id,
      time,
    };

    this.selected.push(false);
    this.value.push(note);
    this.$emit('added', note);
    this.checkLoopEnd();
  }
}
</script>

<style lang="sass" scoped>

</style>