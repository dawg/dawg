<template>
  <div class="patterns">
    <drag
      group="arranger"
      v-for="(item, i) in items"
      :key="i"
      class="pattern"
      :transfer-data="item.prototype"
      :class="{ selected: value && item.pattern.id === value.id }"
      @click.native="click(item.pattern)"
      @contextmenu.native="context($event, i)"
    >
      {{ item.pattern.name }}
    </drag>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';
import { Pattern, PlacedPattern } from '@/schemas';
import { Nullable } from '@/utils';
import { Watch } from '@/modules/update';

@Component
export default class Patterns extends Vue {
  @Prop(Nullable(Object)) public value!: Pattern | null;
  @Prop({ type: Array, required: true }) public patterns!: Pattern[];

  get items() {
    return this.patterns.map((pattern) => {
      return {
        prototype: PlacedPattern.create(pattern),
        pattern,
      };
    });
  }

  public click(p: Pattern) {
    if (this.value && this.value.id === p.id) {
      this.$emit('input', null);
    } else {
      this.$emit('input', p);
    }
  }

  public context(event: MouseEvent, i: number) {
    this.$context({
      event,
      items: [
        {
          text: 'Delete',
          callback: () => this.$emit('remove', i),
        },
      ],
    });
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