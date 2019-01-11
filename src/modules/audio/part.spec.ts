import { expect } from 'chai';
import Part from './part';
import Offline from './offline';

describe('part', () => {
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
  });

});
