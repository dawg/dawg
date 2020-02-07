import { Time } from '@/lib/audio/types';
import Tone from 'tone';

/**
 * A source of an audio signal.
 */
export interface Source<T> {
  triggerAttackRelease(note: string, duration: Time, time: number, velocity?: number): this;
  triggerAttack(note: string, time?: Time, velocity?: number): this;
  triggerRelease(note: string): this;
  disconnect(node: Tone.AudioNode): this;
  connect(node: Tone.AudioNode): this;
  set<K extends keyof T>(o: { key: K, value: T[K] }): void;
}
