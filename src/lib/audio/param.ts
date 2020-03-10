import { ObeoAbstractParamOptions, ObeoParam, createAbstractParam } from '@/lib/audio/abstract-param';

export type ObeoParamOptions = ObeoAbstractParamOptions;

// TODO min/max values??
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
