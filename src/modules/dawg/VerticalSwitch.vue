<template>
  <div class="onoffswitch onoffswitch-inner">
    <div 
      class="upper"
      @click="selectTop"
      :class="topClass"
    ></div>
    <div
      class="lower" 
      @click="selectBottom"
      :class="bottomClass"
    ></div>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';

@Component
export default class VerticalSwitch extends Vue {
  @Prop({ type: Boolean, required: true }) public top!: boolean;

  get bottom() {
    return !this.top;
  }

  get topClass() {
    if (this.top) {
      return 'primary';
    } else {
      return 'primary-lighten-6';
    }
  }

  get bottomClass() {
    if (this.bottom) {
      return 'primary';
    } else {
      return 'primary-lighten-6';
    }
  }

  public selectTop() {
    if (!this.top) {
      this.$update('top', true);
    }
  }

  public selectBottom() {
    if (this.top) {
      this.$update('top', false);
    }
  }
}
</script>

<style scoped lang="sass">
$size: 30px

.onoffswitch
  position: relative
  height: $size
  display: flex
  flex-direction: column
  margin-left: 10px

.upper, .lower
  float: left
  height: $size
  width: $size
  border: 2px solid transparent
  background-clip: padding-box
  content: ""
  background-color: #FFFFFF
  transition: .5s
  border-radius: 4px

  &:hover
    cursor: pointer
</style>