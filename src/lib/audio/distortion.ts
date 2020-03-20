import { ObeoEffect, createEffect } from '@/lib/audio/effect';
import { createWaveShaper } from '@/lib/audio/wave-shaper';
import { Setter, setter } from '@/lib/reactor';

export interface ObeoDistortion extends ObeoEffect {
  distortion: Setter<number>;
  oversample: Setter<OverSampleType>;
}

export interface ObeoDistortionOptions {
  distortion: number;
  oversample: OverSampleType;
}

export const createDistortion = (options?: Partial<ObeoDistortionOptions>): ObeoDistortion => {
  const shaper = createWaveShaper();

  let distortionAmount = options?.distortion ?? 0.4;
  const distortion = setter(() => {
    return distortionAmount;
  }, (value) => {
    distortionAmount = value;
    const k = value * 100;
    const deg = Math.PI / 180;
    shaper.setMap((x) => {
      if (Math.abs(x) < 0.001) {
        // should output 0 when input is 0
        return 0;
      } else {
        return (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x));
      }
    });
  });

  // So that the shaper map is initialized
  distortion.value = distortionAmount;

  const effect = createEffect(shaper);

  return {
    ...effect,
    distortion,
    oversample: shaper.oversample,
  };
};
