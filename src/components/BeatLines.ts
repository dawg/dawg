import { Vue, Component, Prop } from 'vue-property-decorator';
import { CreateElement } from 'vue';
import * as dawg from '@/dawg';
import { range } from '@/lib/std';

@Component
export default class BeatLines extends Vue {
  @Prop({ type: Number, required: true }) public pxPerBeat!: number;
  @Prop({ type: Number, required: true }) public beatsPerMeasure!: number;
  @Prop({ type: Number, required: true }) public stepsPerBeat!: number;

  public $el!: HTMLElement;

  get measureColor() {
    return dawg.theme.darken(dawg.theme.default, 5);
  }

  get stepColor() {
    return dawg.theme.darken(dawg.theme.default, 2);
  }

  get beatColor() {
    return dawg.theme.darken(dawg.theme.default, 4);
  }

  get viewBox() {
    return this.pxPerBeat * this.beatsPerMeasure;
  }

  public getX(step: number) {
    return this.stepPx + this.stepPx * ( step - 1 ) - .5;
  }

  get stepPx() {
    return this.pxPerBeat / this.stepsPerBeat;
  }

  get measureSteps() {
    return this.stepsPerBeat * this.beatsPerMeasure;
  }

  get svg() {
    const steps = range(1, this.measureSteps).map((step) => {
      const fill = step % this.beatsPerMeasure ? this.stepColor : this.beatColor;
      const rectX = this.stepPx + this.stepPx * (step - 1) - .5;
      return `<rect fill="${fill}" height="1px" width="1px" y="0" x="${rectX}"/>`;
    });

    const x = this.stepPx + this.stepPx * (this.measureSteps - 1) - 1.5;
    steps.push(`<rect fill="${this.measureColor}" height="1px" width="3px" y="0" x="${x}"/>`);
    return `
<svg
  preserveAspectRatio="none"
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 ${this.viewBox} 1"
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
        // See https://github.com/apache/cordova-android/issues/645
        // for why we prepend '%23' instead of #
        // Annoyingly encodeURI does not yet do this so we have to do it manually
        backgroundImage: `url("data:image/svg+xml, ${encodeURI(this.svg).replace(/#/g, '%23')}")`,
        backgroundSize: `${this.viewBox}px 1px`,
      },
    });
  }
}
