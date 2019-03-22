import { Time } from '@/modules/audio/types';
import Tone from 'tone';

/**
 * A source of an audio signal.
 */
export interface Source<T> {
  triggerAttackRelease(note: string, duration: Time, time: number, velocity?: number): this;
  triggerAttack(note: string): this;
  triggerRelease(note: string): this;
  connect(node: Tone.AudioNode): this;
  set<K extends keyof T>(o: { key: K, value: T[K] }): void;
}
