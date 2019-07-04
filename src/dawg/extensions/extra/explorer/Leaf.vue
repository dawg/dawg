<template>
  <div></div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';
import { ExtensionData } from '@/dawg/extensions/extra/explorer/types';
import Tree from '@/dawg/extensions/extra/explorer/Tree.vue';

@Component
export default class Leaf extends Vue {
  @Prop({ type: Object, required: true }) public data!: ExtensionData<any, any>;

  public $parent!: Tree;
}
</script>

<style lang="sass" scoped>

</style>