<template>
  <div class="loading" v-if="value">
    <span
      class="bar"
      v-for="style in styles"
      :key="style.left"
      :style="style"
    ></span>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';
import { range } from '@/lib/std';
import { computed, createComponent } from '@vue/composition-api';

export default createComponent({
  name: 'Loading',
  props: {
    numBars: { type: Number, default: 5 },
    value: { type: Boolean, default: true },
  },
  setup(props) {
    return {
      styles: computed(() => {
        return range(props.numBars).map((i) => {
          return {
            left: `${11 * i}px`,
            animationDelay: `${0.2 * i}s`,
          };
        });
      }),
    };
  },
});

@Component
export class Loading extends Vue {



}
</script>

<style scoped>
.loading {
  /* position: relative; */
  display: flex;
  justify-content: center;
  align-items: center;
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: 2000;
}

.bar {
  display: block;
  bottom: 0px;
  width: 9px;
  height: 5px;
  background: var(--secondary);
  margin: 0 1px;
  animation: audio-wave 1.5s infinite ease-in-out;
}

@keyframes audio-wave {
  /*effect is to animate the height of each span from 5px to 30px*/
  /*translateY makes Y axis move down to give the effect that it is growing from the center*/
  
  0% {
    height: 5px;
    background: var(--secondary);
  }

  25% {
    height: 40px;
    background: var(--primary);
  }

  50% {
    height: 5px;
    background: var(--secondary);
  }

  100% {
    height: 5px;
    background: var(--secondary);
  }
}

</style>