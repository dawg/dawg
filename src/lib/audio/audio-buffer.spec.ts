import { createTestAudioBuffer } from '@/lib/audio/test-utils';
import { range } from '@/lib/std';
import { expect } from '@/lib/testing';

describe('ObeoBuffer', () => {
  it('creates a mono track correctly', () => {
    const buffer = createTestAudioBuffer(range(10), range(10));
    const mono = buffer.toMono(buffer);
    expect(Array.from(mono.toArray()[0])).to.deep.eq(range(10).map((value) => value * 2));
  });
});
