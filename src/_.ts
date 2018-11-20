export function zip<A, B>(a: A[], b: B[]): Array<[A, B]> {
  return a.map((_, i) => {
    return [a[i], b[i]];
  }) as Array<[A, B]>;
}
