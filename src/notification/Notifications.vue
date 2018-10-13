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
      </slot>
    </div>
  </transition-group>
</div>
</template>
<script>
import plugin                         from './index'
import { events }                     from './events'

const defaults = {
  position: ['top', 'right'],
  cssAnimation: 'vn-fade',
}

const directions = {
  x: ['left', 'center', 'right'],
  y: ['top', 'bottom']
}

/**
  * Sequential ID generator
  */
export const Id = (i => () => i++)(0)

/**
  * Splits space/tab separated string into array and cleans empty string items.
  */
export const split = (value) => {
  if (typeof value !== 'string') {
    return []
  }

  return value.split(/\s+/gi).filter(v => v)
}

/**
  * Cleanes and transforms string of format "x y" into object {x, y}. 
  * Possible combinations:
  *   x - left, center, right
  *   y - top, bottom
  */
export const listToDirection = (value) => {
  if (typeof value === 'string') {
    value = split(value)
  }

  let x = null
  let y = null

  value.forEach(v => {
    if (directions.y.indexOf(v) !== -1) {
      y = v
    }
    if (directions.x.indexOf(v) !== -1) {
      x = v
    }
  })

  return { x, y }
}

const STATE = {
  IDLE: 0,
  DESTROYED: 2
}

const Component = {
  name: 'Notifications',
  props: {
    group: {
      type: String,
      default: ''
    },

    width: {
      type: Number,
      default: 300
    },

    reverse: {
      type: Boolean,
      default: false
    },

    position: {
      type: [String, Array],
      default: () => {
        return defaults.position
      }
    },

    classes: {
      type: String,
      default: 'vue-notification'
    },

    speed: {
      type: Number,
      default: 300
    },
    /* Todo */
    cooldown: {
      type: Number,
      default: 0
    },

    duration: {
      type: Number,
      default: 3000
    },

    delay: {
      type: Number,
      default: 0
    },

    max: {
      type: Number,
      default: Infinity
    }
  },
  data () {
    return {
      list: [],
      velocity: plugin.params.velocity
    }
  },
  mounted () {
    events.$on('add', this.addItem);
  },
  computed: {

    styles () {
      const { x, y } = listToDirection(this.position)
      const width = this.width.value
      const suffix = this.width.type

      let styles = {
        width: width + suffix,
        [y]: '0px'
      }

      if (x === 'center') {
        styles['left'] = `calc(50% - ${width/2}${suffix})`
      } else {
        styles[x] = '0px'
      }

      return styles
    },

    active () {
      return this.list.filter(v => v.state !== STATE.DESTROYED)
    },

    botToTop () {
      return this.styles.hasOwnProperty('bottom')
    }
  },
  methods: {
    addItem (event) {
      event.group = event.group || ''

      if (this.group !== event.group) {
        return
      }

      if (event.clean || event.clear) {
        this.destroyAll()
        return
      }

      const duration = typeof event.duration === 'number'
        ? event.duration
        : this.duration

      const speed = typeof event.speed === 'number'
        ? event.speed
        : this.speed

      let { title, text, type, data } = event

      const item = {
        id: Id(),
        title,
        text,
        type,
        state: STATE.IDLE,
        speed,
        length: duration + 2 * speed,
        data
      }

      if (duration >= 0) {
        item.timer = setTimeout(() => {
          this.destroy(item)
        }, item.length)
      }

      let direction = this.reverse
        ? !this.botToTop
        : this.botToTop

      let indexToDestroy = -1

      if (direction) {
        this.list.push(item)

        if (this.active.length > this.max) {
          indexToDestroy = 0
        }
      } else {
        this.list.unshift(item)

        if (this.active.length > this.max) {
          indexToDestroy = this.active.length - 1
        }
      }

      if (indexToDestroy !== -1) {
        this.destroy(this.active[indexToDestroy])
      }
    },

    notifyClass (item) {
      return [
        'notification',
        this.classes,
        item.type
      ]
    },

    notifyWrapperStyle (item) {
      return {transition: `all ${item.speed}ms`}
    },

    destroy (item) {
      clearTimeout(item.timer)
      item.state = STATE.DESTROYED

      if (!this.isVA) {
        this.clean()
      }
    },

    destroyAll () {
      this.active.forEach(this.destroy)
    },

    clean () {
      this.list = this.list.filter(v => v.state !== STATE.DESTROYED)
    }
  }
}

export default Component
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
  display: block;
  box-sizing: border-box;
  background: white;
  text-align: left;
}

.notification-title {
  font-weight: 600;
}

.vue-notification {
  font-size: 12px;
  padding: 10px;
  margin: 0 5px 5px;

  color: white;
  background: #44A4FC;
  border-left: 5px solid #187FE7;
}

.vue-notification.warn {
  background: #ffb648;
  border-left-color: #f48a06;
}

.vue-notification.error {
  background: #E54D42;
  border-left-color: #B82E24;
}

.vue-notification.success {
  background: #68CD86;
  border-left-color: #42A85F;
}

.vn-fade-enter-active, .vn-fade-leave-active, .vn-fade-move  {
  transition: all .5s;
}

.vn-fade-enter, .vn-fade-leave-to {
  opacity: 0;
}

</style>
