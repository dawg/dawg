<template>
  <div class="patterns">
    <div
      v-for="(pattern, i) in patterns"
      :key="i"
      class="pattern"
      :class="{ selected: pattern.name === value }"
      @click="click(pattern)"
    >
      {{ pattern.name }}
    </div>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';
import { Pattern } from '@/models';
import { Nullable } from '@/utils';

@Component
export default class Patterns extends Vue {
  @Prop(Nullable(Object)) public value!: Pattern | null;
  @Prop({ type: Array, required: true }) public patterns!: Pattern[];
  public click(p: Pattern) {
    if (this.value && this.value.name === p.name) {
      this.$emit('input', null);
    } else {
      this.$emit('input', p);
    }
  }
  public mounted() {
    this.$emit('input', this.patterns[0] || null);
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

.selected
  border: 1px solid rgba(255, 255, 255, 0.36)
</style>