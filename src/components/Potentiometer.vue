<<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 100 100">
  <circle :r="center" :cx="center" :cy="center" :fill="secondaryColor"></circle>
  <rect
    :width="rectWidth"
    :x="center - rectWidth / 2"
    :y="center - size / 8 * 4"
    :height="size / 3" fill="#000"
    :transform="transform"
  ></rect>
</svg>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';

// TODO We don't need this now but we should eventuall create a Knob mixin

@Component
export default class Potentiometer extends Vue {
  @Prop({ type: Number, default: 6 }) public rectWidth!: number;
  get transform() {
    return `rotate(${-this.valueDegrees} ${this.center} ${this.center})`;
  }
  get valueDegrees() {
    return ((this.valueRadians * 360) / 2 / Math.PI) - 90;
  }
  get center() {
    return this.size / 2;
  }
}
</script>

<style lang="sass" scoped>

</style>