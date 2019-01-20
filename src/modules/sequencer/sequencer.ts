import Vue from 'vue';
import { Prop, Inject, Component, Mixins } from 'vue-property-decorator';

@Component
export class Positionable extends Vue {
  @Inject() public pxPerBeat!: number;

  @Prop({ type: Number, required: true }) public height!: number;
  @Prop({ type: Number, required: true }) public duration!: number;
  @Prop({ type: Number, required: true }) public left!: number;
  @Prop({ type: Number, required: true }) public top!: number;

  get style() {
    return {
      width: this.widthPx,
      height: this.heightPx,
      left: this.leftPx,
      top: this.topPx,
    };
  }

  get width() {
    return this.duration * this.pxPerBeat;
  }

  get widthPx() {
    return this.px(this.width);
  }

  get heightPx() {
    return this.px(this.height);
  }

  get leftPx() {
    return this.px(this.left);
  }

  get topPx() {
    return this.px(this.top);
  }

  public px(value: number) {
    return `${value}px`;
  }

  public updateDuration(value: number) {
    this.$update('duration', value);
  }
}


