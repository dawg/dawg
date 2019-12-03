import { manager } from '@/base/manager';

type Level = 'info' | 'debug' | 'error' | 'trace' | 'warn';
type LevelLookup = { [L in Level]: number };
const levelLookup: LevelLookup = {
  trace: 0,
  debug: 1,
  info: 2,
  warn: 3,
  error: 4,
};

type Logger = { [L in Level]: (message: string) => void } & { level: Level };

const logMessage = (setLevel: Level, level: Level, message: string) => {
  if (levelLookup[level] < levelLookup[setLevel]) {
    return;
  }

  console[level](message);
};

const getLogger = (base?: string): Logger => {
  base = base === undefined ? '' : base + ': ';
  return {
    level: 'info',
    trace(message: string) { logMessage(this.level, 'trace', message); },
    debug(message: string) { logMessage(this.level, 'debug', message); },
    info(message: string) { logMessage(this.level, 'info', message); },
    warn(message: string) { logMessage(this.level, 'warn', message); },
    error(message: string) { logMessage(this.level, 'error', message); },
  };
};

export const log = manager.activate({
  id: 'dawg.log',
  activate() {
    const logger = getLogger();
    return {
      getLogger(level?: Level) {
        if (!manager.activating.length) {
          throw Error('`getLogger` must be called while activating an extension');
        }

        const last = manager.activating[manager.activate.length - 1];
        const newLogger =  getLogger(last.id);
        newLogger.level = level || 'info';
        return newLogger;
      },
      info: logger.info,
      debug: logger.debug,
      trace: logger.trace,
      warn: logger.warn,
      error: logger.error,
    };
  },
});
