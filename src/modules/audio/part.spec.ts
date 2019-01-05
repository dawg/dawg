import { expect } from 'chai';
import Part from './part';
import global from './global';

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('part', () => {
  // before(() => {
  //   global.context = new OfflineAudioContext(1, 1, 44100);
  // });
  it('can loop events scheduled on the transport', async () => {
    // global.context = new OfflineAudioContext(2, 0.41, 44100);
    const part = new Part();
    let invocations = 0;
    part.schedule(() => {
      invocations++;
    }, 0);
    part.loopStart = 0;
    part.loopEnd = 0.1;
    part.loop = true;
    part.play();
    // await sleep(0.5);
    expect(invocations).to.equal(5);
    // Transport.setLoopPoints(0, 0.1).start(0);
  });

});
