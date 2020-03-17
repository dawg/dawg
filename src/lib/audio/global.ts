import { ObeoBaseContext } from '@/lib/audio/context';
import { context } from '@/lib/audio/online';

/**
 * The global audio context which is getable and assignable through
 * getContext and setContext
 */
let globalContext: ObeoBaseContext = context;

/**
 * Returns the default system-wide [[Context]]
 * @category Core
 */
export function getContext(): ObeoBaseContext {
  return globalContext;
}

/**
 * Set the default audio context
 * @category Core
 */
export function setContext(c: ObeoBaseContext): void {
  globalContext = c;
}

/**
 * Most browsers will not play _any_ audio until a user
 * clicks something (like a play button). Invoke this method
 * on a click or keypress event handler to start the audio context.
 * More about the Autoplay policy
 * [here](https://developers.google.com/web/updates/2017/09/autoplay-policy-changes#webaudio)
 */
export function start(): Promise<void> {
  return globalContext.resume();
}
