import { expect as ex } from 'chai';

type Expect = <T>(value: T) => Assertion<T>;

type Equal<T> = (value: T, message?: string) => Assertion<T>;

type Throw<T> = (constructor: ErrorConstructor, message?: string) => Assertion<T>;

type NumberComparer<T> = (value: T, message?: string) => Assertion<T>;

type CloseTo<T> = (expected: T & number, delta: number, message?: string) => Assertion<T>;

interface Deep<T> {
  equal: Equal<T>;
  equals: Equal<T>;
  eq: Equal<T>;
}

interface NumericComparison<T> {
  above: NumberComparer<T>;
  gt: NumberComparer<T>;
  greaterThan: NumberComparer<T>;
  least: NumberComparer<T>;
  gte: NumberComparer<T>;
  below: NumberComparer<T>;
  lt: NumberComparer<T>;
  lessThan: NumberComparer<T>;
  most: NumberComparer<T>;
  lte: NumberComparer<T>;
  within(start: T, finish: T, message?: string): Assertion<T>;
}

type Assertion<T> = {
  to: Assertion<T>;
  deep: Deep<T>;
  be: Assertion<T>;
  closeTo: CloseTo<T>;
  not: Assertion<T>;
  eq: Equal<T>;
  equal: Equal<T>;
  is: Assertion<T>
  throw: Throw<T>;
  gte: NumberComparer<T>;
  gt: NumberComparer<T>;
  greaterThan: NumberComparer<T>;
} & (number extends T ? NumericComparison<T> : {});

export const expect = ex as Expect;

export const whenBetween = (value: number, lowerBound: number, upperBound: number, f: () => void) => {
  if (value > lowerBound && value < upperBound) {
    f();
  }
};
