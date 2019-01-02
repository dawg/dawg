<template>
  <div class="primary footer position white--text" :style="style">
    <v-tooltip top>
      <div slot="activator" class="name item">{{ projectName }}</div>
      <div>Project Name</div>
    </v-tooltip>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator';
import { Nullable } from '@/utils';

@Component
export default class Foot extends Vue {
  @Prop({ type: [String, Number], default: 22 }) public height!: string | number;
  @Prop(Nullable(String)) public projectName!: string | null;
  get style() {
    return { lineHeight: `${this.height}px` };
  }
}
</script>

<style lang="sass" scoped>
.footer
  display: flex
  width: 100%
  font-size: 12px
  height: 100%
  text-align: center
  position: unset
  padding: 0 10px

.item
  margin: 0 4px
  padding-top: 1px
</style>
