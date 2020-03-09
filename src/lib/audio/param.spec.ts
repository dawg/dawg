import { createParam, ObeoParam } from '@/lib/audio/param';
import { createGain } from '@/lib/audio/gain';
import { expect } from '@/lib/testing';
import { createOfflineContext } from '@/lib/audio/offline';

export const context = createOfflineContext({ length: 1, numberOfChannels: 1, sampleRate: 11025 });

describe.only('ObeoParam', () => {
  let param: ObeoParam;
  beforeEach(() => {
    param = createParam(createGain().gain);
  });

  it('can initialize', () => {
    let p = createParam(createGain().gain);
    expect(p.value).to.eq(1);
    p = createParam(createGain().gain, { value: 1.5 });
    expect(p.value).to.eq(1.5);
  });

  it('correctly performs conversion', () => {
    const p = createParam(createGain().gain, {
      toUnit: (v) => v / 4,
      fromUnit: (v) => v * 2,
    });

    p.value = 0.3;
    expect(p.value).to.eq(0.15);
  });

  it('can be set', () => {
    param.value = 0.5;
    expect(param.value).to.eq(0.5);
  });
});
