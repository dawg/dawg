import { Vue, Component, Prop } from 'vue-property-decorator';

// Make this an actual component
@Component
export default class BeatLines extends Vue {
  @Prop({ type: Number, required: true }) public pxPerBeat!: number;
  @Prop({ type: Number, required: true }) public beatsPerMeasure!: number;
  @Prop({ type: Number, required: true }) public stepsPerBeat!: number;

  public $el!: HTMLElement;
  public beatColor = 'rgba(0,0,0,.4)';
  public stepColor = 'rgba(0,0,0,.1)';
  public measureColor = 'rgb(0,0,0)';

  public get viewBox() {
    return this.pxPerBeat * this.beatsPerMeasure;
  }

  public getX(step: number) {
    return this.stepPx + this.stepPx * ( step - 1 ) - .5;
  }

  public fill(step: number) {
    return step % this.beatsPerMeasure ? this.stepColor : this.beatColor;
  }

  public get stepPx() {
    return this.pxPerBeat / this.stepsPerBeat;
  }

  public get measureSteps() {
    return this.stepsPerBeat * this.beatsPerMeasure;
  }

  public mounted() {
    let el = this.$refs.beatLines as HTMLElement;
    if (el && !(el instanceof HTMLElement)) {
      this.$log.warn('beatLines must be a HTMLElement');
      return;
    }

    if (!el) { el = this.$el; }
    el.classList.add('beat-lines');
    // this.$el.style.height = '100%';
    // this.$el.style.width = '100%';
    el.style.backgroundRepeat = 'repeat';
    el.style.backgroundAttachment = 'local';

    const steps = [ `<rect x='0' y='0' height='1px' width='1px' fill='${ this.measureColor }'/>` ];

    for ( let step = 1; step < this.measureSteps; step++ ) {
      const rectX = this.stepPx + this.stepPx * ( step - 1 ) - .5;
      const fill = step % this.beatsPerMeasure ? this.stepColor : this.beatColor;
      steps.push(`<rect height='1px' width='1px' y='0' x='${rectX}' fill='${fill}'/>`);
    }

    const x = this.stepPx + this.stepPx * ( this.measureSteps - 1 ) - .5;
    steps.push(`<rect y='0' height='1px' width='1px' fill='${this.measureColor}' x='${x}'/>`);
    const svg =
`<svg
  preserveAspectRatio='none'
  xmlns='http://www.w3.org/2000/svg'
  viewBox='0 0 ${this.viewBox} 1'
>
  ${steps.join('\n  ')}
</svg>
      `;

    el.style.backgroundImage = `url("data:image/svg+xml,${encodeURI(svg)}")`;
    el.style.backgroundSize = `${this.viewBox}px 1px`;

  }
}
