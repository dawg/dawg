export let isWindows = false;
export let isMacintosh = false;
export let isLinux = false;
export let isNative = false;
export let isWeb = false;

const isElectronRenderer = (
  typeof process !== 'undefined' &&
  typeof process.versions !== 'undefined' &&
  typeof process.versions.electron !== 'undefined' &&
  process.type === 'renderer'
);

// OS detection
if (typeof navigator === 'object' && !isElectronRenderer) {
  const userAgent = navigator.userAgent;
  isWindows = userAgent.indexOf('Windows') >= 0;
  isMacintosh = userAgent.indexOf('Macintosh') >= 0;
  isLinux = userAgent.indexOf('Linux') >= 0;
  isWeb = true;
} else if (typeof process === 'object') {
  isWindows = (process.platform === 'win32');
  isMacintosh = (process.platform === 'darwin');
  isLinux = (process.platform === 'linux');
  isNative = true;
}

export const enum Platform {
  Mac,
  Linux,
  Windows,
}

export let platform: Platform = Platform.Linux;
if (isMacintosh) {
  platform = Platform.Mac;
} else if (isWindows) {
  platform = Platform.Windows;
}
