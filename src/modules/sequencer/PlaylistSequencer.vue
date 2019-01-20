<template>
  <sequencer
    v-on="$listeners"
    v-bind="$attrs"
    :num-rows="20"
    :row-height="40"
    :row-class="() => 'secondary'"
    :row-style="rowStyle"
  ></sequencer>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';
import Sequencer from '@/modules/sequencer/Sequencer.vue';

@Component({
  components: { Sequencer },
})
export default class PlaylistSequencer extends Vue {
  public rowStyle() {
    return {
      borderBottom: '1px solid black',
    };
  }
}
</script>

<style lang="sass" scoped>

</style>