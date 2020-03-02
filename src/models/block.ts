import * as oly from '@/lib/olyger';

export interface BuildingBlock {
  readonly id: string;
  readonly name: oly.OlyRef<string>;
}
