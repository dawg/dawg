export interface Action {
  text: string;
  callback: (samplePath: string) => void;
}
