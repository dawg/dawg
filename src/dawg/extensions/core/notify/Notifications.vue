<template>
  <div class="notifications" :style="styles">
    <transition-group name="vn-fade">
      <div
        v-for="(item, i) in list"
        :class="notifyClass(item)"
        :style="notifyWrapperStyle(item)"
        :key="item.id"
      >
        <div :class="notifyIconClass(item)" class="left">
          <dg-fa-icon :icon="item.icon"></dg-fa-icon>
        </div>
        <div :class="notifyBodyClass(item)" class="right">
          <div style="display: flex">
            <div
              v-if="item.title"
              class="notification-title"
              v-html="item.title"
            ></div>
            <div style="flex: 1"></div>
            <dg-button
              v-if="list.length > 1 && i === 0"
              type="text"
              :class="buttonClass(item)"
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
    </transition-group>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop} from 'vue-property-decorator';
import { reverse } from '@/utils';
import * as framework from '@/framework';
import { Marked } from 'marked-ts';

const directions = {
  x: ['left', 'center', 'right'],
  y: ['top', 'bottom'],
};

const ICON_LOOKUP = {
  info: 'info-circle',
  success: 'check',
  warning: 'exclamation-triangle',
  error: 'ban',
};

interface Notification extends framework.notify.Notification {
  icon: string;
}

export const Id = ((i) => () => i++)(0);


interface NotificationItem {
  type: string;
  id: number;
  icon: string;
  text?: string;
  title: string;
}

@Component
export default class Notifications extends Vue {
  @Prop({ type: Number, default: 300 }) public width!: number;
  @Prop({ type: Boolean, default: false }) public reverse!: boolean;
  @Prop({ type: Number, default: 6000 }) public duration!: number;
  @Prop({ type: Number, default: 0 }) public delay!: number;
  @Prop({ type: Number, default: Infinity }) public max!: number;
  @Prop(Boolean) public bottom!: number;
  @Prop(Boolean) public left!: number;

  public list: NotificationItem[] = [];
  public speed = 300;
  public timers: {[s: string]: NodeJS.Timer} = {};

  public parse(text: string) {
    return Marked.parse(text);
  }

  public mounted() {
    framework.notify.subscribe((notification) => {
      this.addItem({
        ...notification,
        icon: ICON_LOOKUP[notification.type],
      });
    });
  }

  get styles() {
    const x = this.left ? 'left' : 'right';
    const y = this.bottom ? 'bottom' : 'top';

    return {
      width: this.width,
      [y]: '0',
      [x]: '0',
    };
  }

  get botToTop() {
    return this.styles.hasOwnProperty('bottom');
  }

  public addItem(event: Notification) {
    const { message, params, type, icon } = event;
    const { detail, dismissible = false, duration = this.duration } = params;

    const item = {
      id: Id(),
      title: message,
      text: detail,
      icon,
      type,
      length: duration + 2 * this.speed,
    };

    if (duration !== Infinity && duration >= 0) {
      this.timers[item.id] = setTimeout(() => {
        const i = this.list.indexOf(item);
        this.destroy(i);
      }, item.length);
    }

    const direction = this.reverse
      ? !this.botToTop
      : this.botToTop;

    let indexToDestroy = -1;

    if (direction) {
      this.list.push(item);

      if (this.list.length > this.max) {
        indexToDestroy = 0;
      }
    } else {
      this.list.unshift(item);

      if (this.list.length > this.max) {
        indexToDestroy = this.list.length - 1;
      }
    }

    if (indexToDestroy !== -1) {
      this.destroy(indexToDestroy);
    }
  }

  public notifyClass(item: NotificationItem) {
    return [
      'notification',
      `fg-${item.type}-darken-3`,
    ];
  }

  public buttonClass(item: NotificationItem) {
    return [
      'close-all',
      `fg-${item.type}-darken-3`,
    ];
  }

  public notifyIconClass(item: NotificationItem) {
    return [
      'icon',
      `bg-${item.type}`,
    ];
  }

  public notifyBodyClass(item: NotificationItem) {
    return [
      'notification-body',
      `bg-${item.type}-lighten-4`,
    ];
  }

  public notifyWrapperStyle(item: NotificationItem) {
    return {
      transition: `all ${this.speed}ms`,
    };
  }

  public destroy(i: number) {
    if (this.list[i] === undefined) {
      return;
    }

    clearTimeout(this.timers[this.list[i].id]);
    this.list.splice(i, 1);
  }

  public destroyAll() {
    for (const index of reverse(this.list.map((_, i) => i))) {
      this.destroy(index);
    }
  }
}

</script>

<style scoped lang="scss">
.notifications {
  display: block;
  position: fixed;
  z-index: 5000;
}

.notification {
  display: block;
  overflow: hidden;
  width: 100%;
  margin: 0;
  padding: 0;
  display: flex;
  box-sizing: border-box;
  text-align: left;
  font-size: 12px;
  margin: 2px 10px;
  border-radius: 3px;
  overflow: hidden;
  width: 30em;
}

.notification-title {
  padding: 5px;
  font-weight: bold;
}

.vn-fade-enter-active, .vn-fade-leave-active, .vn-fade-move  {
  transition: all .5s;
}

.vn-fade-enter, .vn-fade-leave-to {
  opacity: 0;
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
