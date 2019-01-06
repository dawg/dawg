import { expect } from 'chai';
import Part from './part';
import global from './global';
import Tone from 'tone';
import Offline from './offline';

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('part', () => {
  // before(() => {
  //   global.context = new OfflineAudioContext(1, 1, 44100);
  // });
  it('can loop events scheduled on the transport', async () => {
    let invocations = 0;
    return Offline(() => {
        const part = new Part();
        part.schedule(() => {
          invocations++;
        }, 0);
        part.setLoopPoints(0, 0.1).start(0);
        part.loop = true;
      }, 0.41).then(() => {
        expect(invocations).to.equal(5);
      });
    // const duration = 2.5 / 120 * 60;
    // global.context = new Tone.OfflineContext(2, duration, 44100);
    // // @ts-ignore
    // Tone.context = global.context;



    // part.schedule(() => {
    //   invocations++;
    // }, 0);
    // part.loopStart = 0;
    // part.loopEnd = 0.5;
    // part.loop = true;
    // part.play();
    // // @ts-ignore
    // global.context.render();
    // await sleep(1000);
    // expect(invocations).to.equal(1);
    // Transport.setLoopPoints(0, 0.1).start(0);
  });

});
