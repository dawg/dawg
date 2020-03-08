import { Seconds, ContextTime } from '@/lib/audio/types';
import { Disposer } from '@/lib/std';

// TODO maybe remove??
/**
 * A source of an audio signal.
 */
export interface Source<T> {
  triggerAttackRelease(note: string, duration: Seconds, time: ContextTime, velocity?: number): this;
  triggerAttack(note: string, time?: ContextTime, velocity?: number): Disposer;
  disconnect(node: AudioNode): void;
  connect(node: AudioNode): void;
  set<K extends keyof T>(o: { key: K, value: T[K] }): void;
}
