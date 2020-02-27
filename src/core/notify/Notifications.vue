<template>
  <div class="notifications right-0 top-0">
    <div
      v-for="(item, i) in notifications"
      class="notification"
      :class="{ [`fg-${item.type}-darken-3`]: true, remove: !item.show }"
      :key="item.id"
    >
      <div class="left icon" :class="`bg-${item.type}`">
        <dg-fa-icon :icon="item.icon"></dg-fa-icon>
      </div>
      <div :class="`bg-${item.type}-lighten-4`" class="notification-body right">
        <div style="display: flex">
          <div
            v-if="item.title"
            class="notification-title"
            v-html="item.title"
          ></div>
          <div class="flex-grow"></div>
          <dg-button
            v-if="notifications.length > 1 && i === 0"
            type="text"
            class="close-all"
            :class="`fg-${item.type}-darken-3`"
            @click="destroyAll"
            style="margin-top: -2px"
          >
            Close All
          </dg-button>
          <dg-mat-icon class="text-sm cursor-pointer" @click="destroy(i)" icon="close"></dg-mat-icon>
        </div>
        <div
          v-if="item.text"
          class="notification-content"
          v-html="parse(item.text)"
        ></div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { reverse, Disposer } from '@/lib/std';
import * as framework from '@/lib/framework';
import { Marked } from 'marked-ts';
import { createComponent, onMounted, onUnmounted } from '@vue/composition-api';

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
      };

      if (duration !== Infinity && duration >= 0) {
        timers[item.id] = setTimeout(() => {
          item.show = false;
          setTimeout(() => {
            const i = notifications.indexOf(item);
            destroy(i);
          }, 5000); // 5 seconds is a lot but it's OK, we're just being safe
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

    return {
      notifications,
      destroyAll,
      parse,
      destroy,
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

.notifications {
  display: block;
  position: fixed;
  z-index: 5000;
}

.notification {
  display: block;
  overflow: hidden;
  margin: 0;
  padding: 0;
  display: flex;
  box-sizing: border-box;
  text-align: left;
  font-size: 12px;
  margin: 2px 10px;
  border-radius: 3px;
  overflow: hidden;
  width: $width;
  animation: notification-show .25s cubic-bezier(0.175, 0.885, 0.32, 1.27499);

  &.remove {
    animation: notification-hide   .12s      cubic-bezier(.34,.07,1,.2),
               notification-shrink .24s .12s cubic-bezier(0.5, 0, 0, 1);
    animation-fill-mode: forwards;
  }
}

.notification-title {
  padding: 5px;
  font-weight: bold;
}

.icon {
  padding: 5px;
  padding-top: 10px;
  color: rgba(255,255,255,0.85);
}

.notification-body {
  width: 100%;
  padding: 5px;
}

.notification-content {
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  padding: 5px;
  max-height: 150px;
  overflow-y: scroll;
}

.close-all {
  background-color: transparent!important;
  margin: 4px;
}

$width: 26px;
.left {
  width: $width;
}

.right {
  width: calc(100% - #{$width});
}
</style>
