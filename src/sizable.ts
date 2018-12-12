import { Prop, Component, Vue } from 'vue-property-decorator';

@Component
export class Sizable extends Vue {
  @Prop({ type: Number, default: 80 }) public pxPerBeat!: number;
  public get pxPerStep() {
    // TODO Hardcoded
    return this.pxPerBeat / 4;
  }
}
