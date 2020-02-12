<template>
  <div class="patterns">
    <drag
      group="arranger"
      v-for="(item, i) in items"
      :key="i"
      :class="classes(item.pattern)"
      class="text-default hover:bg-default-lighten-2 cursor-pointer border py-3 px-4"
      :transfer-data="item.prototype"
      @click.native="click(item.pattern)"
      @contextmenu.native="context($event, i)"
    >
      <editable
        v-model="item.pattern.name"
        :contenteditable.sync="contenteditable"
        disableDblClick
        class="label"
      ></editable>
    </drag>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';
import { Pattern, ScheduledPattern } from '@/models';
import { Nullable } from '@/lib/vutils';
import { Watch } from '@/lib/update';
import * as framework from '@/lib/framework';
import { theme } from '@/core/theme';

@Component
export default class Patterns extends Vue {
  @Prop(Object) public value!: Pattern | undefined;
  @Prop({ type: Array, required: true }) public patterns!: Pattern[];
  public contenteditable = false;

  get items() {
    return this.patterns.map((pattern) => {
      return {
        prototype: ScheduledPattern.create(pattern),
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
    framework.context({
      position: event,
      items: [
        {
          text: 'Delete',
          callback: () => this.$emit('remove', i),
        },
        {
          text: 'Rename',
          callback: () => this.contenteditable = true,
        },
      ],
    });
  }

  public classes(pattern: Pattern) {
    if (pattern === this.value) {
      return 'border-default-lighten-5';
    } else {
      return 'border-default';
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
