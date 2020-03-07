import { context } from '@/lib/audio/context';
import { createParam } from '@/lib/audio/param';

export interface ConstantSourceOptions {
  value: number;
}

export const createConstantSource = (options?: Partial<ConstantSourceOptions>) => {
  const source = context.createConstantSource();
  source.offset.value = options?.value ?? source.offset.defaultValue;
  const offset = createParam(source.offset);
  return Object.assign({ offset }, source);
};

export type ConstantSource = ReturnType<typeof createConstantSource>;
