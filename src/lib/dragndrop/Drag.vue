<template>
	<component :is="tag"
		:draggable="draggable"
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
import { getLogger } from '@/lib/log';

const logger = getLogger('Drag');

export default createComponent({
  props: {
    draggable: { type: Boolean, default: true },
    transferData: {},
    dropEffect: { type: String as () => DropEffect },
    effectAllowed: { type: String as () => AllowedEffect },
    tag: { type: String, default: 'div' },
    group: { type: String, required: true },
  },
  setup(props, context) {
    const dragging = ref(false);

    const scopedData = computed(() => {
      return dragging.value && props.transferData;
    });

    const hideImageStyle = computed(() => ({ position: 'fixed', top: '-1000px' }));

    function emitEvent(
      name: 'dragstart' | 'dragenter' | 'dragover' | 'dragleave' | 'dragend', nativeEvent: DragEvent,
    ) {
      logger.debug(`Starting ${name} event!`);

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
        transferDataStore.group = props.group;

        // Set the allowed effects
        if (props.effectAllowed) {
          transfer.effectAllowed = props.effectAllowed;
        }

        logger.debug('Setting transferData to -> ', props.transferData);

        // Set the transfer data
        if (props.transferData !== undefined) {
          transferDataStore.data = props.transferData;
          // Set a dummy string for the real transfer data. Not actually used
          // for anything, but necesssary for browser compatibility.
          transfer.setData('text', '');
        }
        // Indicate that we're dragging.
        dragging.value = true;
      }
      // At last, emit the event.
      context.emit(name, props.transferData, nativeEvent);

      // Clean up stored data on drag end after emitting.
      if (name === 'dragend') {
        transferDataStore.group = undefined;
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