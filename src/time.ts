export class Time {
  constructor(public value: number) {}
  public toTransportTime() {
    const { measures, quarters, sixteenths } = this.toParts();
    return `${measures}:${quarters}:${sixteenths}`;
  }
  public toSixteenths() {
    return this.value;
  }
  public toQuarters() {
    return this.toSixteenths() / 4;
  }
  public toParts() {
    // TODO Hardcoded time signature
    const sixteenths = this.value % 4;
    const rem = Math.floor(this.value / 4);
    const quarters = rem % 4;
    const measures = Math.floor(rem / 4);
    return { measures, quarters, sixteenths };
  }
  public sub(other: Time) {
    return new Time(this.value - other.value);
  }
  public scale(factor: number) {
    return new Time(this.value * factor);
  }
  public add(other: Time) {
    return new Time(this.value + other.value);
  }
  public asPx(pxPerSixteenth: number, { offset }: { offset?: Time }) {
    if (!offset) {
      offset = new Time(0);
    }
    return this.sub(offset).value * pxPerSixteenth + 'px';
  }
}
