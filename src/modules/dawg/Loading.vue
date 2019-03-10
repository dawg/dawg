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
import { range } from '@/utils';

@Component
export default class Loading extends Vue {
  @Prop({ type: Number, default: 5 }) public numBars!: number;
  @Prop({ type: Boolean, default: true }) public value!: boolean;

  get styles() {
    return range(this.numBars).map((i) => {
      return {
        left: `${11 * i}px`,
        animationDelay: `${0.2 * i}s`,
      };
    });
  }
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

/* TODO The colors should use the Theme!! */
.bar {
  display: block;
  bottom: 0px;
  width: 9px;
  height: 5px;
  background: #9b59b6;
  margin: 0 1px;
  animation: audio-wave 1.5s infinite ease-in-out;
}

@keyframes audio-wave {
  /*effect is to animate the height of each span from 5px to 30px*/
  /*translateY makes Y axis move down to give the effect that it is growing from the center*/
  
  0% {
    height: 5px;
    background: #9b59b6;
  }

  25% {
    height: 40px;
    background: #3498db;
  }

  50% {
    height: 5px;
    background: #9b59b6;
  }

  100% {
    height: 5px;
    background: #9b59b6;
  }
}

</style>