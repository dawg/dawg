<template>
  <div class="onoffswitch onoffswitch-inner">
    <div 
      class="upper"
      @click="selectTop"
      :class="{ 'primary-lighten-3': top }"
    ></div>
    <div
      class="lower" 
      @click="selectBottom"
      :class="{ 'primary-lighten-3': bottom }"
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