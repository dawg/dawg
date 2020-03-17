import { createStateTimeline } from '@/lib/audio/state-timeline';
import { expect } from '@/lib/testing';

describe('ObeoStateTimeline', () => {
  it('can be created and disposed', () => {
    const timeline = createStateTimeline();
    timeline.dispose();
  });

  it('can schedule a state at a given time', () => {
    const timeline = createStateTimeline();
    timeline.setStateAtTime('started', 0);
    timeline.setStateAtTime('stopped', 1);
    timeline.setStateAtTime('started', 1);
    timeline.dispose();
  });

  it('can get a state at a given time', () => {
    const timeline = createStateTimeline();
    timeline.setStateAtTime('started', 0);
    timeline.setStateAtTime('stopped', 1);
    timeline.setStateAtTime('started', 2);
    expect(timeline.getValueAtTime(1)).to.equal('stopped');
    expect(timeline.getValueAtTime(0.999)).to.equal('started');
    timeline.dispose();
  });

  it('returns initial state if it\'s before any scheduled states', () => {
    const timeline = createStateTimeline();
    timeline.setStateAtTime('started', 0);
    timeline.setStateAtTime('stopped', 1);
    timeline.setStateAtTime('started', 2);
    expect(timeline.getValueAtTime(-11)).to.equal('stopped');
    timeline.dispose();
  });

  it('returns the last event inserted if the timing is very close', () => {
    const timeline = createStateTimeline();
    timeline.setStateAtTime('stopped', 1 + 1e-7);
    timeline.setStateAtTime('started', 1 - 1e-7);
    expect(timeline.getValueAtTime(1 - 1e-7)).to.equal('started');
    timeline.dispose();
  });

  it('returns initial state if defined and query time is before any scheduled states', () => {
    const timeline = createStateTimeline({ initial: 'started' });
    timeline.setStateAtTime('started', 20);
    timeline.setStateAtTime('stopped', 21);
    timeline.setStateAtTime('started', 22);
    expect(timeline.getValueAtTime(0)).is.equal('started');
    timeline.dispose();
  });

  it('gets the last occurance of the state at or before the given time', () => {
    const timeline = createStateTimeline();
    timeline.setStateAtTime('started', 0);
    timeline.setStateAtTime('stopped', 1);
    timeline.setStateAtTime('started', 2);
    timeline.setStateAtTime('stopped', 3);
    expect(timeline.getLastState('stopped', 1)).to.not.eq(undefined);
    expect(timeline.getLastState('stopped', 1)!.state).is.equal('stopped');
    expect(timeline.getLastState('stopped', 2))!.to.not.eq(undefined);
    expect(timeline.getLastState('stopped', 2)!.state).is.equal('stopped');
    expect(timeline.getLastState('stopped', 2)!.time).is.equal(1);
    expect(timeline.getLastState('stopped', 0.9)!.time).to.equal(0);
    expect(timeline.getLastState('stopped', 4)!.state).is.equal('stopped');
    expect(timeline.getLastState('stopped', 4)!.time).is.equal(3);
    timeline.dispose();
  });

  it('gets the next occurance of the state at or before the given time', () => {
    const timeline = createStateTimeline();
    timeline.setStateAtTime('started', 0);
    timeline.setStateAtTime('stopped', 1);
    timeline.setStateAtTime('started', 2);
    timeline.setStateAtTime('stopped', 3);
    expect(timeline.getNextState('stopped', 1)).to.not.eq(undefined);
    expect(timeline.getNextState('stopped', 1)!.state).is.equal('stopped');
    expect(timeline.getNextState('stopped', 2)).to.not.eq(undefined);
    expect(timeline.getNextState('stopped', 2)!.state).is.equal('stopped');
    expect(timeline.getNextState('stopped', 2)!.time).is.equal(3);
    expect(timeline.getNextState('stopped', 0.9)).to.not.eq(undefined);
    expect(timeline.getNextState('stopped', 0.9)!.state).is.equal('stopped');
    expect(timeline.getNextState('stopped', 0.9)!.time).is.equal(1);
    timeline.dispose();
  });
});
