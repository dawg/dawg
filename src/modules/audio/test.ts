import { expect as ex } from 'chai';

type Expect = <T>(value: T) => Assertion<T>;

type Equal<T> = (value: T, message?: string) => Assertion<T>;

type Throw<T> = (constructor: ErrorConstructor, message?: string) => Assertion<T>;

type NumberComparer<T> = (value: T, message?: string) => Assertion<T>;

type CloseTo<T> = (expected: T & number, delta: number, message?: string) => Assertion<T>;

interface Assertion<T> {
  to: Assertion<T>;
  be: Assertion<T>;
  closeTo: CloseTo<T>;
  not: Assertion<T>;
  eq: Equal<T>;
  equal: Equal<T>;
  throw: Throw<T>;
  gte: NumberComparer<T>;
  gt: NumberComparer<T>;
  greaterThan: NumberComparer<T>;
}

export const expect = ex as Expect;

export const whenBetween = (value: number, lowerBound: number, upperBound: number, f: () => void) => {
  if (value > lowerBound && value < upperBound) {
    f();
  }
};
