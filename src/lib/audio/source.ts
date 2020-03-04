import { Seconds, ContextTime } from '@/lib/audio/types';
import Tone from 'tone';
import { Disposer } from '@/lib/std';

/**
 * A source of an audio signal.
 */
export interface Source<T> {
  triggerAttackRelease(note: string, duration: Seconds, time: ContextTime, velocity?: number): this;
  triggerAttack(note: string, time?: ContextTime, velocity?: number): Disposer;
  disconnect(node: Tone.AudioNode): this;
  connect(node: Tone.AudioNode): this;
  set<K extends keyof T>(o: { key: K, value: T[K] }): void;
}
