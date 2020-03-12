import { ObeoAbstractParamOptions, ObeoAbstractParam, createAbstractParam } from '@/lib/audio/abstract-param';

export type ObeoParamOptions = ObeoAbstractParamOptions;

export type ObeoParam = ObeoAbstractParam;

export const createParam = (
  param: AudioParam,
  opts: Partial<ObeoParamOptions> = {},
): ObeoParam => {
  return createAbstractParam(
    param,
  () => ({ addEventInformation: () => ({}), extension: {} }),
    opts,
  );
};
