<template>
  <component
    :is="tag" 
    class="drag-element"
    @wheel="mousewheel"
    @mousedown="addListeners"
    @mouseenter="onHover"
    @mouseleave="afterHover"
    @click="stopClick"
  >
    <slot></slot>
  </component>
</template>

<script lang="ts">
import { createComponent, ref, onUnmounted } from '@vue/composition-api';

export default createComponent({
  name: 'DragElement',
  props: {
    tag: { type: String, default: 'div' },
    cursor: { type: String, default: 'auto' },
  },
  setup(props, context) {
    const previous = ref<{ x: number, y: number }>(null);
    const moving = ref(false);
    const mousewheelPosition = ref<number>(null);

    function move(e: MouseEvent) {
      context.emit('move', e);
    }

    function beforeMove() {
      context.emit('before-move');
    }

    function afterMove() {
      context.emit('after-move');
    }

    function scrollMove(delta: { x: number, y: number }) {
      context.emit('scroll-move', delta);
    }

    function showCursor() {
      if (document.documentElement) {
        document.documentElement.style.cursor = props.cursor;
      }
    }
    function resetCursor() {
      if (document.documentElement) {
        document.documentElement.style.cursor = 'auto';
      }
    }

    function addListeners(e: MouseEvent) {
      if (e.which !== 1) { return; } // if not left click

      prevent(e);
      showCursor();
      moving.value = true;
      previous.value = { x: e.clientX, y: e.clientY };

      beforeMove();
      window.addEventListener('mousemove', startMove);
      window.addEventListener('mouseup', removeListeners);
    }

    function removeListeners(e?: MouseEvent) {
      if (e) { prevent(e); }

      resetCursor();
      previous.value = null;
      moving.value = false;
      window.removeEventListener('mousemove', startMove);
      window.removeEventListener('mouseup', removeListeners);

      afterHover();
      afterMove();
    }

    function mousewheel(e: MouseWheelEvent) {
      if (!mousewheelPosition.value) {
        mousewheelPosition.value = 0;
      }

      // delta y is negative when scrolling away from user.
      mousewheelPosition.value -= e.deltaY;

      // 65 was determined from trial and error
      const y = Math.floor(mousewheelPosition.value / 65);
      mousewheelPosition.value %= 65;

      // Right now, we only support y movement and not x movement.
      scrollMove({ x: 0, y });
    }

    function startMove(e: MouseEvent) {
      if (!previous.value) {
        removeListeners();
        return;
      }

      prevent(e);
      previous.value = { x: e.clientX, y: e.clientY };
      move(e);
    }

    function prevent(e: Event) {
      e.preventDefault();
      e.stopPropagation();
    }

    function onHover() {
      if (moving.value) { return; }
      showCursor();
    }

    function afterHover() {
      if (moving.value) { return; }
      mousewheelPosition.value = null;
      resetCursor();
    }

    function stopClick(e: MouseEvent) {
      e.stopPropagation();
    }

    // Always reset when destroyed
    // We can get into weird states where the component is destroyed while hovering
    onUnmounted(afterHover);

    return {
      mousewheel,
      addListeners,
      onHover,
      afterHover,
      stopClick,
    };
  },
});
</script>
