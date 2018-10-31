import Vue from 'vue';

export abstract class Child extends Vue {
  public abstract size: number;
  public abstract minSize: number;
}

export type Direction = 'horizontal' | 'vertical';

// tslint:disable-next-line:max-classes-per-file
export abstract class Parent extends Vue {
  public abstract direction: Direction;
  public abstract changeAreaSize(): void;
}
