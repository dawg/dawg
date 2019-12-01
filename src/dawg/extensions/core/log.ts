import { manager } from '@/base/manager';

type Level = 'info' | 'debug' | 'error' | 'fatal' | 'trace' | 'warn';

// TODO fix level
const getLogger = (base?: string) => {
  base = base === undefined ? '' : base + ': ';
  return {
    trace: (message: string) => {
      // tslint:disable-next-line:no-console
      console.trace(base + message);
    },
    debug: (message: string) => {
      // tslint:disable-next-line:no-console
      console.debug(base + message);
    },
    info: (message: string) => {
      // tslint:disable-next-line:no-console
      console.info(base + message);
    },
    warn: (message: string) => {
      // tslint:disable-next-line:no-console
      console.warn(base + message);
    },
    error: (message: string) => {
      // tslint:disable-next-line:no-console
      console.error(base + message);
    },
  };
};

const logger = getLogger();

export const log = manager.activate({
  id: 'dawg.log',
  activate() {
    return {
      getLogger(level?: Level) {
        if (!manager.activating.length) {
          throw Error('`getLogger` must be called while activating an extension');
        }

        const last = manager.activating[manager.activate.length - 1];
        const newLogger =  getLogger(last.id);
        // newLogger.level = level || 'info';
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
