import * as Audio from '@/modules/audio';

export function loadFromUrl(url: string) {
  const request = new XMLHttpRequest();
  request.open('GET', url, true);
  request.responseType = 'arraybuffer';
  request.send();
  return new Promise<AudioBuffer>((resolve, reject) => {
    request.onreadystatechange = () => {
      if (request.readyState === 4 && request.status === 200) {
        Audio.Context.context.decodeAudioData(request.response).then((buff) => {
          resolve(buff);
        });
      }
    };
  });
}
