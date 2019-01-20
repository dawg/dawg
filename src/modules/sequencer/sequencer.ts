import Vue from 'vue';
import { Prop, Inject, Component, Mixins } from 'vue-property-decorator';
import { Watch } from '@/modules/update';

export interface Item {
  row: number;
  time: number;
  duration: number;
}

type Class<T> = new(...args: any[]) => T;

export type ItemClass = Class<Item>;


interface EventInterface {
  classes: Item | Array<[Item, Vue]>;
}

class Bus extends Vue {
  public $on<T extends keyof EventInterface>(name: T, callback: (payload: EventInterface[T]) => void) {
    return super.$on(name, callback);
  }
  public $emit<T extends keyof EventInterface>(name: T, payload: EventInterface[T]) {
    return super.$emit(name, payload);
  }
}

export default new Bus();


@Component
export class Positionable extends Vue {
  @Inject() public noteHeight!: number;
  @Inject() public pxPerBeat!: number;

  @Prop({ type: Number, required: true }) public duration!: number;

  get width() {
    return this.duration * this.pxPerBeat;
  }

  get height() {
    return this.noteHeight;
  }

  get widthPx() {
    return this.px(this.width);
  }

  get heightPx() {
    return this.px(this.height);
  }

  public px(value: number) {
    return `${value}px`;
  }

  public updateDuration(value: number) {
    this.$update('duration', value);
  }
}


