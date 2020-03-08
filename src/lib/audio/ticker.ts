import { emitter } from '@/lib/events';

const events = emitter<{ tick: [] }>();
const updateInterval = 0.03;

const blob = new Blob([
  // the initial timeout time
  'var timeoutTime = ' + (updateInterval * 1000).toFixed(1) + ';' +
  // onmessage callback
  'self.onmessage = function(msg){' +
  '	timeoutTime = parseInt(msg.data);' +
  '};' +
  // the tick function which posts a message
  // and schedules a new tick
  'function tick(){' +
  '	setTimeout(tick, timeoutTime);' +
  '	self.postMessage(\'tick\');' +
  '}' +
  // call tick initially
  'tick();',
]);

const blobUrl = URL.createObjectURL(blob);
const worker = new Worker(blobUrl);
worker.onmessage = () => events.emit('tick');


export const onDidTick = (f: () => void) => {
  events.on('tick', f);
  return {
    dispose: () => {
      events.off('tick', f);
    },
  };
};

export const dispose = () => {
  events.removeAllListeners();
  worker.terminate();
};
