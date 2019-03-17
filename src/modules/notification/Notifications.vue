<template>
  <div class="notifications" :style="styles">
    <transition-group name="vn-fade">
      <div
        v-for="(item, i) in list"
        :class="notifyClass(item)"
        :style="notifyWrapperStyle(item)"
        :key="item.id"
      >
        <div :class="notifyIconClass(item)">
          <icon :name="item.icon"></icon>
        </div>
        <div :class="notifyBodyClass(item)">
          <div style="display: flex">
            <div
              v-if="item.title"
              class="notification-title"
              v-html="item.title"
            ></div>
            <div style="flex: 1"></div>
            <v-btn 
              v-if="list.length > 1 && i === 0"
              :class="buttonClass(item)"
              @click="destroyAll"
              flat
              small
            >
              Close All
            </v-btn>
            <v-icon small @click="destroy(i)">close</v-icon>
          </div>
          <div
            class="notification-content"
            v-html="item.text"
          ></div>
        </div>
      </div>
    </transition-group>
  </div>
</template>
<script lang="ts">

import { events, Notification } from './events';
import { Vue, Component, Prop} from 'vue-property-decorator';
import { reverse } from '@/utils';

const directions = {
  x: ['left', 'center', 'right'],
  y: ['top', 'bottom'],
};

export const Id = ((i) => () => i++)(0);


interface NotificationItem {
  type: string;
  id: number;
  icon: string;
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

  public mounted() {
    events.$on('add', this.addItem);
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
    // TODO: Need to put this back
    // if (event.clean || event.clear) {
    //   this.destroyAll();
    //   return
    // }

    // const duration = typeof event.duration === 'number'
    //   ? event.duration
    //   : this.duration;

    const duration = this.duration;

    const { message, params, type, icon } = event;
    const { detail, dismissible = false } = params;

    const item = {
      id: Id(),
      title: message,
      text: detail,
      icon,
      type,
      length: duration + 2 * this.speed,
    };

    if (duration >= 0) {
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
      `${item.type}-darken-3--text`,
    ];
  }

  public buttonClass(item: NotificationItem) {
    return [
      'close-all',
      `${item.type}-darken-3--text`,
    ];
  }

  public notifyIconClass(item: NotificationItem) {
    return [
      'icon',
      item.type,
    ];
  }

  public notifyBodyClass(item: NotificationItem) {
    return [
      'notification-body',
      `${item.type}-lighten-4`,
    ];
  }

  public notifyWrapperStyle(item: NotificationItem) {
    return {
      transition: `all ${this.speed}ms`,
    };
  }

  public destroy(i: number) {
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

<style scoped>
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
}

.close-all {
  background-color: transparent!important;
  margin: 4px;
}
</style>
