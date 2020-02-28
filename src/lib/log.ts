import * as CSS from 'csstype';
import { keys } from '@/lib/std';

type Level = 'info' | 'debug' | 'error' | 'trace' | 'warn';
type LevelLookup = { [L in Level]: number };
const levelLookup: LevelLookup = {
  trace: 0,
  debug: 1,
  info: 2,
  warn: 3,
  error: 4,
};

type Logger = { [L in Level]: (message: string, ...args: any[]) => void } & { level: Level };

const rgbs = {
  black: [0, 0, 0],
  red: [237, 80, 65],
  green: [102, 172, 92],
  yellow: [225, 178, 60],
  blue: [73, 148, 201],
  magenta: [127, 23, 53],
  cyan: [78, 181, 230],
  white: [255, 255, 255],
  gray: [124, 124, 124],
  grey: [124, 124, 124],
} as const;

const rgb = ([r, g, b]: readonly [number, number, number]) => {
  return `rgb(${r}, ${g}, ${b})`;
};

const styles: { [K in Level]: CSS.Properties } = {
  info: {
    backgroundColor: rgb(rgbs.green),
    color: 'white',
    fontWeight: 'bold',
    padding: '4px 6px',
    borderRadius: '4px',
  },
  warn: {
    backgroundColor: rgb(rgbs.yellow),
    color: 'white',
    fontWeight: 'bold',
    padding: '4px 6px',
    borderRadius: '4px',
  },
  error: {
    backgroundColor: rgb(rgbs.red),
    color: 'white',
    fontWeight: 'bold',
    padding: '4px 6px',
    borderRadius: '4px',
  },
  trace: {
    backgroundColor: rgb(rgbs.gray),
    color: 'white',
    fontWeight: 'bold',
    padding: '4px 6px',
    borderRadius: '4px',
  },
  debug: {
    backgroundColor: rgb(rgbs.blue),
    color: 'white',
    fontWeight: 'bold',
    padding: '4px 6px',
    borderRadius: '4px',
  },
};

const camelToKebab = (str: string) => str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();

const camelToKebabObject = (o: CSS.Properties) => {
  const result: { [k: string]: string | number | undefined } = {};
  keys(o).forEach((key) => result[camelToKebab(key)] = o[key]);
  return result;
};

export const getLogger = (name: string, { level }: { level?: Level } = {}): Logger => {
  return {
    level: level ?? 'info',
    trace(message: string, ...args: any[]) {
      log({ setLevel: this.level, name, level: 'trace', message, args });
    },
    debug(message: string, ...args: any[]) {
      log({ setLevel: this.level, name, level: 'debug', message, args });
    },
    info(message: string, ...args: any[]) {
      log({ setLevel: this.level, name, level: 'info', message, args });
    },
    warn(message: string, ...args: any[]) {
      log({ setLevel: this.level, name, level: 'warn', message, args });
    },
    error(message: string, ...args: any[]) {
      log({ setLevel: this.level, name, level: 'error', message, args });
    },
  };
};

export interface LogMessage {
  message: string;
  name: string;
  level: Level;
  setLevel: Level;
  args: any[];
}

export const log = (message: LogMessage) => {
  if (levelLookup[message.level] < levelLookup[message.setLevel]) {
    return;
  }

  const kebabStyle = camelToKebabObject(styles[message.level]);
  const styleArray = Object.keys(kebabStyle).map((key) => `${key}: ${kebabStyle[key]}`);
  const styleString = styleArray.join('; ');
  const messageString = `%c[${message.name}] ${message.level.toUpperCase()}: ${message.message}`;

  // tslint:disable-next-line:no-console
  console.log(messageString, styleString, ...message.args);
};


