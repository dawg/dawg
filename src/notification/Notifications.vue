<template>
<div
  class="notifications"
  :style="styles"
>
  <transition-group name="vn-fade">
    <div
      v-for="item in list"
      v-if="item.state != 2"
      class="notification-wrapper"
      :style="notifyWrapperStyle(item)"
      :key="item.id"
      :data-id="item.id"
    >
      <slot
        name="body"
        :class="[classes, item.type]"
        :item="item"
        :close="() => destroy(item)"
      >
        <!-- Default slot template -->
        <div
          :class="notifyClass(item)"
          @click="destroy(item)"
        >
          <div :class="notifyIconClass(item)">
            <icon name="info-circle"></icon>
          </div>
          <div :class="notifyBodyClass(item)">
            <div
                    v-if="item.title"
                    class="notification-title"
                    v-html="item.title"
            >
            </div>
            <div
                    class="notification-content"
                    v-html="item.text"
            >
            </div>
          </div>
        </div>
      </slot>
    </div>
  </transition-group>
</div>
</template>
<script lang="ts">

import { events, Notification, Params }              from './events'
import { Vue, Component, Prop} from 'vue-property-decorator'

const directions = {
  x: ['left', 'center', 'right'],
  y: ['top', 'bottom']
};

/**
  */
export const Id = (i => () => i++)(0);

/**
  * Splits space/tab separated string into array and cleans empty string items.
  */
export const split = (value: string) => {
  return value.split(/\s+/gi).filter(v => v)
};

/**
  * Cleanes and transforms string of format "x y" into object {x, y}. 
  * Possible combinations:
  *   x - left, center, right
  *   y - top, bottom
  */
export const listToDirection = (value: string[]) => {
  let x = '';
  let y = '';

  value.forEach(v => {
    if (directions.y.indexOf(v) !== -1) {
      y = v
    }
    if (directions.x.indexOf(v) !== -1) {
      x = v
    }
  });

  return { x, y }
};

enum STATE{
  IDLE,
  DESTROYED
};

interface NotificationItem {
  state: STATE;
  type: string;
  speed: number;
  id: number;
}

@Component
export default class Notifications extends Vue {
  @Prop({type: Number, default: 300}) width!: number;

  @Prop({type: Boolean, default: false}) reverse!: boolean;

  @Prop({type: String, default: 'vue-notification'}) classes!: string;

  @Prop({type: Number, default: 300}) speed!: number;
  /* Todo */
  @Prop({type: Number, default: 0}) cooldown!: number;

  @Prop({type: Number, default: 5000}) duration!: number;

  @Prop({type: Number, default: 0}) delay!: number;

  @Prop({type: Number, default: Infinity}) max!: number;

  @Prop({type: [Array], default: () => ['top', 'right']}) position!: string[]; 

  list: NotificationItem[] = [];
  timers: any = {};

  mounted () {
    events.$on('add', this.addItem);
  }

  get styles () {
    const { x, y } = listToDirection(this.position);

    let styles = {
      width: this.width,
      [y]: '0px'
    };

    if (x === 'center') {
      styles['left'] = `calc(50% - ${this.width/2}px)`
    } else {
      styles[x] = '0px'
    }

    return styles
  }

  get active () {
    return this.list.filter(v => v.state !== STATE.DESTROYED)
  }

  get botToTop () {
    return this.styles.hasOwnProperty('bottom')
  }

  addItem (event: Notification) {

    // TODO: Need to put this back 
    // if (event.clean || event.clear) {
    //   this.destroyAll();
    //   return
    // }

    // const duration = typeof event.duration === 'number'
    //   ? event.duration
    //   : this.duration;

    // const speed = typeof event.speed === 'number'
    //   ? event.speed
    //   : this.speed;

    const duration = this.duration;
    const speed = this.speed;

    let { message, params, type} = event;
    let { detail, dismissible} = params;

    const item = {
      id: Id(),
      title: message,
      text: detail,
      type,
      state: STATE.IDLE,
      speed,
      length: duration + 2 * speed,
    };

    if (duration >= 0) {
      this.timers[item.id] = setTimeout(() => {
        this.destroy(item)
      }, item.length)
    }

    let direction = this.reverse
      ? !this.botToTop
      : this.botToTop;

    let indexToDestroy = -1;

    if (direction) {
      this.list.push(item);

      if (this.active.length > this.max) {
        indexToDestroy = 0
      }
    } else {
      this.list.unshift(item);

      if (this.active.length > this.max) {
        indexToDestroy = this.active.length - 1
      }
    }

    if (indexToDestroy !== -1) {
      this.destroy(this.active[indexToDestroy])
    }
  }

  notifyClass (item: NotificationItem) {
    return [
      'notification',
      this.classes,
      `${item.type}-darken-4--text`

    ]
  }

  notifyIconClass (item: NotificationItem) {
      return [
          'icon',
          item.type
      ]
  }

  notifyBodyClass (item: NotificationItem) {
      return [
          'notification-body',
          `${item.type}-lighten-4`
      ]
  }

  notifyWrapperStyle (item: NotificationItem) {
    return {transition: `all ${item.speed}ms`}
  }

  destroy (item: NotificationItem) {
    clearTimeout(this.timers[item.id]);
    item.state = STATE.DESTROYED;
    this.clean()
  }

  destroyAll () {
    this.active.forEach(this.destroy)
  }

  clean () {
    this.list = this.list.filter(v => v.state !== STATE.DESTROYED)
  }
};

</script>
<style>
.notifications {
  display: block;
  position: fixed;
  z-index: 5000;
}

.notification-wrapper {
  display: block;
  overflow: hidden;
  width: 100%;
  margin: 0;
  padding: 0;
}

.notification {
  display: flex;
  box-sizing: border-box;
  text-align: left;
}

.notification-title {
  padding: 5px;
  font-weight: bold;
}

.vue-notification {
  font-size: 12px;
  margin: 2px 10px;
  border-radius: 3px;
  overflow: hidden;
  width: 20em;
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
</style>
