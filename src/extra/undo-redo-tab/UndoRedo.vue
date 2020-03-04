<template>
  <div>

    <undo-redo-action
      v-for="(action, i) in undoStack"
      :key="action.id"
      :action="action"
      :has-been-executed="true"
      @seek="seekUndo(i)"
    ></undo-redo-action>

    <undo-redo-action
      v-for="(action, i) in redoStack.slice().reverse()"
      :key="action.id"
      :action="action"
      :has-been-executed="false"
      @seek="seekRedo(i)"
    ></undo-redo-action>

  </div>
</template>

<script lang="ts">
import { createComponent, ref, computed, watch } from '@vue/composition-api';
import * as oly from '@/lib/olyger';
import UndoRedoAction from '@/extra/undo-redo-tab/UndoRedoAction.vue';
import { range } from '@/lib/std';

export default createComponent({
  components: { UndoRedoAction },
  name: 'UndoRedo',
  setup() {
    function seekUndo(i: number) {
      const toUndo = oly.undoStack.length - i - 1;
      range(toUndo).forEach(() => oly.undo());
    }

    function seekRedo(i: number) {
      const toRedo = i + 1;
      range(toRedo).forEach(() => oly.redo());
    }

    return {
      seekUndo,
      seekRedo,
      undoStack: oly.undoStack,
      redoStack: oly.redoStack,
    };
  },
});
</script>
