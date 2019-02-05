import { expect } from 'chai';
import Part from './part';
import Offline from './offline';

const noOp = () => ({});

describe('part', () => {
  it('can loop events scheduled on the transport', async () => {
    let invocations = 0;
    return Offline(() => {
        const part = new Part();
        part.scheduleEvent(() => {
          invocations++;
        }, 0);
        part.setLoopPoints(0, 100).start(0);
        part.loop = true;
      }, 1.1).then(() => {
        expect(invocations).to.equal(5);
      });
  });

  it('can add parts to parts', () => {
    const child = new Part();
    child.scheduleEvent(noOp, 0);
    child.scheduleEvent(noOp, 4);

    const parent = new Part();
    parent.scheduleEvents(child, 0);
    parent.scheduleEvents(child, 5);

    expect(parent.timeline.length).to.equal(4);

    const expected = [0, 4, 5, 9];

    let i = 0;
    parent.timeline.forEach((item) => {
      expect(item.time).to.eq(expected[i++]);
    });
  });

  it('can remove a part from a part', () => {
    const child = new Part();
    child.scheduleEvent(noOp, 0);
    child.scheduleEvent(noOp, 4);

    const parent = new Part();
    parent.scheduleEvents(child, 0);
    expect(parent.timeline.length).to.equal(2);
    parent.removeEvents(child, 0);
    expect(parent.timeline.length).to.equal(0);
  });

  it('can add and remove from parent when events are added/removed from child', () => {
    const child = new Part();
    const parent = new Part();
    parent.scheduleEvents(child, 0);
    expect(parent.timeline.length).to.equal(0);


    const event = child.scheduleEvent(noOp, 2);
    expect(parent.timeline.length).to.equal(1);

    child.removeAtTime(2, event.event);
    expect(parent.timeline.length).to.equal(0);
  });

  it('can add/remove instances', () => {
    class Class {
      //
    }

    const part = new Part<Class>();
    const a = new Class();
    const b = new Class();

    part.add(noOp, 5, a);
    part.add(noOp, 5, b);

    expect(part.timeline.length).to.eq(2);
    part.remove(a); part.remove(a);
    expect(part.timeline.length).to.eq(1);
    part.remove(b);
    expect(part.timeline.length).to.eq(0);
  });
});
