<template>
	<component :is="tag"
		:draggable="draggable"
		@drag="emitEvent('drag', $event)"
		@dragstart="emitEvent('dragstart', $event)"
		@dragenter="emitEvent('dragenter', $event)"
		@dragleave="emitEvent('dragleave', $event)"
		@dragend="emitEvent('dragend', $event)"
	>
		<slot :transfer-data="scopedData"></slot>
	</component>
</template>

<script lang="ts">
import transferDataStore from './transferDataStore';
import { dropEffects, effectsAllowed, DropEffect, AllowedEffect } from './constants';
import { createComponent, ref, computed } from '@vue/composition-api';

export default createComponent({
  props: {
    draggable: { type: Boolean, default: true },
    transferData: {},
    dropEffect: { type: String as () => DropEffect },
    effectAllowed: { type: String as () => AllowedEffect },
    tag: { type: String, default: 'div' },
  },
  setup(props, context) {
    const dragging = ref(false);

    const scopedData = computed(() => {
      return dragging.value && props.transferData;
    });

    const hideImageStyle = computed(() => ({ position: 'fixed', top: '-1000px' }));

    function emitEvent(
      name: 'dragstart' | 'dragenter' | 'dragover' | 'drag' | 'dragleave' | 'dragend', nativeEvent: DragEvent,
    ) {
      const transfer = nativeEvent.dataTransfer;
      if (!transfer) {
        return;
      }

      // Set drop effect on dragenter and dragover
      if (name === 'dragenter' || name === 'dragover') {
        if (props.dropEffect) {
          transfer.dropEffect = props.dropEffect;
        }
      }
      // A number of things need to happen on drag start
      if (name === 'dragstart') {
        // Set the allowed effects
        if (props.effectAllowed) {
          transfer.effectAllowed = props.effectAllowed;
        }
        // Set the transfer data
        if (props.transferData !== undefined) {
          transferDataStore.data = props.transferData;
          // Set a dummy string for the real transfer data. Not actually used
          // for anything, but necesssary for browser compatibility.
          //
          // TODO: Maybe this should be the actual data serialized. But since
          // it's not actually used for anything it seems like a waste of CPU.
          transfer.setData('text', '');
        }
        // Indicate that we're dragging.
        dragging.value = true;
      }
      // At last, emit the event.
      context.emit(name, props.transferData, nativeEvent);

      // Clean up stored data on drag end after emitting.
      if (name === 'dragend') {
        transferDataStore.data = undefined;
        dragging.value = false;
      }
    }

    return {
      emitEvent,
      scopedData,
    };
  },
});
</script>