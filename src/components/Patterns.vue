<template>
  <div class="patterns">
    <div
      v-for="(pattern, i) in patterns"
      :key="i"
      class="pattern"
      :class="{ selected: value && pattern.id === value.id }"
      @click="click(pattern)"
      draggable="true"
    >
      {{ pattern.name }}
    </div>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';
import { Pattern } from '@/schemas';
import { Nullable } from '@/utils';
import { Watch } from '@/modules/update';

@Component
export default class Patterns extends Vue {
  @Prop(Nullable(Object)) public value!: Pattern | null;
  @Prop({ type: Array, required: true }) public patterns!: Pattern[];
  public click(p: Pattern) {
    if (this.value && this.value.id === p.id) {
      this.$emit('input', null);
    } else {
      this.$emit('input', p);
    }
  }

  @Watch<Patterns>('patterns')
  public selectFirstPatternIfNoPatternIsSelected() {
    if (this.value) { return; }
    if (this.patterns.length === 0) { return; }
    this.$emit('input', this.patterns[0]);
  }
}
</script>

<style lang="sass" scoped>
.pattern
  padding: 10px 20px
  color: white
  border: 1px solid rgba(0,0,0,0)

  &:hover
    box-shadow: inset 0 0 100px 100px rgba(255, 255, 255, 0.1)
    cursor: pointer

.selected
  border: 1px solid rgba(255, 255, 255, 0.36)
</style>