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
 * Temporarily set a context for the duration of a function.Useful
 *
 * @param temporary The context to set for the duration of the function.
 * @param cb The callback to invoke.
 */
export const withContext = <T>(temporary: ObeoBaseContext, cb: () => T): T => {
  const original = getContext();
  setContext(temporary);
  try {
    return cb();
  } finally {
    setContext(original);
  }
};

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
