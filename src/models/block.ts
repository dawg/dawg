import * as oly from '@/olyger';

export interface BuildingBlock {
  readonly id: string;
  readonly name: oly.OlyRef<string>;
}
