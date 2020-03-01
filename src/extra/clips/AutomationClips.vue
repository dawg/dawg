<template>
  <div>
    <!-- TODO -->
    <!-- <drag
      v-for="(item, i) in items"
      group="arranger"
      :key="i"
      @contextmenu.native="context($event, i)"
      class="text-default text-sm py-2 px-4 cursor-pointer hover:bg-default-lighten-2"
      :transfer-data="item.prototype"
    >
      {{ item.name }}
    </drag> -->
    <button @click="increment" class="text-default">Increment</button> <br>
    <button @click="append" class="text-default">Append</button> <br>
    <button @click="undo" class="text-default">Undo</button> <br>
    <button @click="redo" class="text-default">Redo</button> <br>
    <div class="text-default">{{ count.v }}</div> <br>
    <div class="text-default">{{ arr }}</div> <br>
    <!-- <div class="text-default">{{ arr }}</div> <br> -->
  </div>
</template>

<script lang="ts">
import { ScheduledAutomation, createAutomationPrototype } from '@/models';
import * as dawg from '@/dawg';
import { createComponent, computed } from '@vue/composition-api';
import * as oly from '@/olyger';
import { createSubscriptions } from '@/lib/vutils';

export default createComponent({
  name: 'AutomationClips',
  props: {},
  setup() {
    const items = computed(() => {
      return dawg.project.automationClips.map((clip, i) => {
        return {
          prototype: createAutomationPrototype({ time: 0, row: 0, duration: clip.duration }, clip, {}),
          name: clip.name,
        };
      });
    });

    function context(event: MouseEvent, i: number) {
      dawg.context({
        position: event,
        items: [
          {
            text: 'Delete',
            callback: () => dawg.project.automationClips.splice(i),
          },
        ],
      });
    }

    const { subscriptions } = createSubscriptions();

    const count = oly.olyRef(0);
    const arr = oly.olyArr<number>([]);

    subscriptions.push(arr.onDidAdd(({ items: o }) => {
      console.log('onDidAdd', o);
      count.v += o.length;
    }));

    return {
      items,
      context,
      arr,
      increment: () => {
        count.v++;
      },
      append: () => {
        arr.push(count.v);
      },
      count,
      undo: () => {
        oly.undo();
      },
      redo: () => {
        oly.redo();
      },
    };
  },
});
</script>
