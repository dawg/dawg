<template>
	<component 
    ref="el"
    :is="tag"
		@dragenter="emitEvent('dragenter', $event)"
		@dragleave="emitEvent('dragleave', $event)"
		@dragover.prevent="emitEvent('dragover', $event)"
		@drop.prevent="emitEvent('drop', $event)"
	>
		<slot :transfer-data="scopedData"></slot>
	</component>
</template>

<script lang="ts">
import transferDataStore from './transferDataStore';
import { createComponent, computed, ref } from '@vue/composition-api';
import Vue from 'vue';

const insideElements = new Set<EventTarget>();
export default createComponent({
  props: {
    tag: { type: String, default: 'div' },
  },
  setup(props, context) {
    const el = ref<HTMLElement | Vue>();
    const transferData = ref<unknown>();
    const isDraggingOver = ref(false);

    const scopedData = computed(() => {
      return isDraggingOver.value && transferData.value;
    });

    function emitEvent(name: 'drop' | 'dragover' | 'dragleave' | 'dragenter', nativeEvent: DragEvent) {
      transferData.value = transferDataStore.data;
      context.emit(name, transferData, nativeEvent);
      /**
       * After emitting the event, we need to determine if we're still
       * dragging inside this Drop. We keep a Set of all elements that we've
       * dragged into, then clear the data if that set is empty.
       */
      // Add to the set on dragenter.
      if (name === 'dragenter') {
        if ((insideElements.size || nativeEvent.target === el.value) && nativeEvent.target) {
          insideElements.add(nativeEvent.target);
        }
      }
      // Remove from the set on dragleave.
      if ((name === 'dragleave') && nativeEvent.target) {
        insideElements.delete(nativeEvent.target);
      }
      // A drop resets everything.
      if (name === 'drop') {
        insideElements.clear();
      }
      // Finally, since Vue can't react to Set changes, set a flag indicating drag status.
      isDraggingOver.value = Boolean(insideElements.size);
    }

    return {
      scopedData,
      emitEvent,
      el,
    };
  },
});
</script>