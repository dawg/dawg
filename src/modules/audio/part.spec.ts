import Part from './part';

describe('part', () => {
  it('works', () => {
    expect(5).toBe(5);
  });
  it('works', () => {
    // const part = new Part();
    const ctx = new AudioContext();
    expect(ctx).toBeDefined();
  });
});
