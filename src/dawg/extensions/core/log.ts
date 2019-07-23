import { manager } from '@/base/manager';
import log4js from 'log4js';

interface Logger extends log4js.Logger {
  level: 'info' | 'debug' | 'error' | 'fatal' | 'trace' | 'warn';
}

const logger = log4js.getLogger();

export const log = manager.activate({
  id: 'dawg.log',
  activate() {
    return {
      getLogger(level?: Logger['level']) {
        if (!manager.activating.length) {
          throw Error('`getLogger` must be called while activating an extension');
        }

        const last = manager.activating[manager.activate.length - 1];
        const newLogger =  log4js.getLogger(last.id);
        newLogger.level = level || 'info';
        return newLogger;
      },
      info: logger.info,
      debug: logger.debug,
      trace: logger.trace,
      warn: logger.warn,
      error: logger.error,
      fatal: logger.fatal,
    };
  },
});
