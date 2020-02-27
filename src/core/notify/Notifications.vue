<template>
  <div class="fixed z-50 right-0 top-0">
    <div
      v-for="(item, i) in notifications"
      class="notification flex rounded-sm overflow-hidden text-xs my-2 mx-2"
      :class="{ [`fg-${item.type}-darken-3`]: true, remove: !item.show }"
      :key="item.id"
    >
      <div class="left pt-2 flex flex-col items-center" :class="`bg-${item.type}`">
        <dg-fa-icon :icon="item.icon" style="color: rgba(255, 255, 255, 0.85)"></dg-fa-icon>
      </div>
      <div :class="`bg-${item.type}-lighten-4`" class="w-full p-2 right">
        <div class="flex h-6">
          <div
            v-if="item.title"
            class="font-bold"
            v-html="item.title"
          ></div>
          <div class="flex-grow"></div>
          <dg-button
            v-if="moreThanOne && i === firstShowIndex"
            type="text"
            :class="`fg-${item.type}-darken-3`"
            @click="destroyAll"
            style="margin-top: -6px; background-color: transparent!important"
          >
            Close All
          </dg-button>
          <dg-mat-icon class="text-sm cursor-pointer" @click="destroy(i)" icon="close"></dg-mat-icon>
        </div>
        <div
          v-if="item.text"
          class="notification-content border-warning border-t py-2 overflow-y-scroll"
          v-html="parse(item.text)"
        ></div>
        <!-- The type error is wrong! We use a v-if -->
        <dg-button
          v-if="item.action"
          :level="item.type"
          @click="item.action.callback"
        >
          {{ item.action.label }}
        </dg-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { reverse, Disposer } from '@/lib/std';
import * as framework from '@/lib/framework';
import { Marked } from 'marked-ts';
import { createComponent, onMounted, onUnmounted, computed } from '@vue/composition-api';

const ICON_LOOKUP = {
  info: 'info-circle',
  success: 'check',
  warning: 'exclamation-triangle',
  error: 'ban',
};

export const genId = ((i) => () => i++)(0);

interface Notification {
  type: string;
  id: number;
  icon: string;
  text?: string;
  title: string;
  show: boolean;
  action?: framework.notify.NotificationAction;
}

export default createComponent({
  name: 'Notifications',
  props: {
    duration: { type: Number, default: 6000 },
  },
  setup(props, context) {
    const notifications: Notification[] = [];
    const timers: {[s: string]: NodeJS.Timer} = {};

    function parse(text: string) {
      return Marked.parse(text);
    }

    let disposer: Disposer | undefined;
    onMounted(() => {
      disposer = framework.notify.subscribe(addItem);
    });

    onUnmounted(() => {
      destroyAll();

      if (disposer) {
        disposer.dispose();
        disposer = undefined;
      }
    });

    function addItem(event: framework.notify.Notification) {
      const { message, params, type } = event;
      const { detail, dismissible = false, duration = props.duration } = params;

      const item = {
        id: genId(),
        title: message,
        text: detail,
        icon: ICON_LOOKUP[type],
        type,
        show: true,
        action: params.action,
      };

      if (duration !== Infinity && duration >= 0) {
        timers[item.id] = setTimeout(() => {
          item.show = false;
          setTimeout(() => {
            const i = notifications.indexOf(item);
            destroy(i);
          }, 240); // This 240 must much the animation time below
        }, duration);
      }


      notifications.push(item);
    }

    function destroy(i: number) {
      if (notifications[i] === undefined) {
        return;
      }

      clearTimeout(timers[notifications[i].id]);
      notifications.splice(i, 1);
    }

    function destroyAll() {
      for (const index of reverse(notifications.map((_, i) => i))) {
        destroy(index);
      }
    }

    const moreThanOne = computed(() => {
      let count = 0;
      for (const notif of notifications) {
        if (notif.show) { count++; }
        if (count >= 2) {
          return true;
        }
      }

      return false;
    });

    const firstShowIndex = computed(() => {
      for (const [i, notif] of notifications.entries()) {
        if (notif.show) {
          return i;
        }
      }

      return -1;
    });

    return {
      notifications,
      destroyAll,
      parse,
      destroy,
      moreThanOne,
      firstShowIndex,
    };
  },
});
</script>

<style scoped lang="scss">
$icon-size: 30px;
$width: 375px;
$max-height: 500px;

@keyframes notification-show {
    0% { opacity: 0; transform: perspective($width) translate(0, -$icon-size) rotateX(90deg); }
  100% { opacity: 1; transform: perspective($width) translate(0,           0) rotateX( 0deg); }
}

@keyframes notification-hide {
    0% { opacity: 1; transform: scale( 1); }
  100% { opacity: 0; transform: scale(.8); }
}

@keyframes notification-shrink {
    0% {  opacity: 0; max-height: $max-height; transform: scale(.8); }
  100% {  opacity: 0; max-height: 0;           transform: scale(.8); }
}

.notification {
  width: $width;
  animation: notification-show .25s cubic-bezier(0.175, 0.885, 0.32, 1.27499);

  &.remove {
    animation: notification-hide   .12s      cubic-bezier(.34,.07,1,.2),
               notification-shrink .24s .12s cubic-bezier(0.5, 0, 0, 1);
    animation-fill-mode: forwards;
  }
}

.notification-content {
  max-height: 150px;
}

.left {
  width: $icon-size;
}

.right {
  width: calc(100% - #{$icon-size});
}
</style>
