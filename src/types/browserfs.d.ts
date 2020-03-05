declare module 'browserfs' {
  export function configure(o: { fs: string, options: any }, onError: (e?: Error) => void): void;
}