import { Vue, Component, Prop } from 'vue-property-decorator';
import { CreateElement } from 'vue';
import * as dawg from '@/dawg';

@Component
export default class BeatLines extends Vue {
  @Prop({ type: Number, required: true }) public pxPerBeat!: number;
  @Prop({ type: Number, required: true }) public beatsPerMeasure!: number;
  @Prop({ type: Number, required: true }) public stepsPerBeat!: number;

  public $el!: HTMLElement;

  get measureColor() {
    return dawg.theme.default;
  }

  get stepColor() {
    return dawg.theme.darken(dawg.theme.default, 3);
  }

  get beatColor() {
    return dawg.theme.darken(dawg.theme.default, 5);
  }

  get viewBox() {
    return this.pxPerBeat * this.beatsPerMeasure;
  }

  public getX(step: number) {
    return this.stepPx + this.stepPx * ( step - 1 ) - .5;
  }

  public fill(step: number) {
    return step % this.beatsPerMeasure ? this.stepColor : this.beatColor;
  }

  get stepPx() {
    return this.pxPerBeat / this.stepsPerBeat;
  }

  get measureSteps() {
    return this.stepsPerBeat * this.beatsPerMeasure;
  }

  get svg() {
    const steps = [ `<rect x='0' y='0' height='1px' width='1.5px' fill='${ this.measureColor }'/>` ];

    for ( let step = 1; step < this.measureSteps; step++ ) {
      const rectX = this.stepPx + this.stepPx * ( step - 1 ) - .5;
      const fill = step % this.beatsPerMeasure ? this.stepColor : this.beatColor;
      steps.push(`<rect height='1px' width='1px' y='0' x='${rectX}' fill='${fill}'/>`);
    }

    const x = this.stepPx + this.stepPx * ( this.measureSteps - 1 ) - .5;
    steps.push(`<rect y='0' height='1px' width='1.5px' fill='${this.measureColor}' x='${x}'/>`);
    return `
    <svg
      preserveAspectRatio='none'
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 ${this.viewBox} 1'
    >
      ${steps.join('\n  ')}
    </svg>
    `;
  }

  public render(h: CreateElement) {
    return h('div', {
      class: 'beat-lines',
      style: {
        backgroundRepeat: 'repeat',
        backgroundAttachment: 'local',
        backgroundImage: `url("data:image/svg+xml,${encodeURI(this.svg)}")`,
        backgroundSize: `${this.viewBox}px 1px`,
      },
    });
  }
}
