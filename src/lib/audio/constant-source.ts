import { context } from '@/lib/audio/online';
import { createParam } from '@/lib/audio/param';

export interface ConstantSourceOptions {
  value: number;
}

// Enhances the "offset" value and renames it "output" ("offset" is readonly)
// See https://developer.mozilla.org/en-US/docs/Web/API/ConstantSourceNode
export const createConstantSource = (options?: Partial<ConstantSourceOptions>) => {
  const source = context.createConstantSource();
  source.offset.value = options?.value ?? source.offset.defaultValue;
  const output = createParam(source.offset);
  return Object.assign(source, { output });
};

export type ConstantSource = ReturnType<typeof createConstantSource>;
