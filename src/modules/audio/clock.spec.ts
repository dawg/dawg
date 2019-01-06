import { expect } from 'chai';
import Clock from './clock';
import global from './global';
import Tone from 'tone';
import Offline from './offline';

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('Clock', () => {
  it('correctly returns the scheduled play state', () => {
    return Offline(() => {
      global.context = Tone.context;
      const clock = new Clock();
      expect(global.context.now()).to.eq(0);
      expect(clock.state).to.equal('stopped');
      clock.start(0).stop(0.2);
      expect(clock.state).to.equal('started');

      return (time: number) => {
        if (time < 0.2) {
          expect(clock.state).to.equal('started');
        } else if (time > 0.2) {
          expect(clock.state).to.equal('stopped');
        }
      };
    }, 0.3);
  });

});
