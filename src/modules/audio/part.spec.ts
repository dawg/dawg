// import { expect } from 'chai';
// import Transport from './transport';
// import Offline from './offline';

const noOp = () => ({});

describe('transport', () => {
  // it('can loop events scheduled on the transport', async () => {
  //   let invocations = 0;
  //   return Offline(() => {
  //       const transport = new Transport();
  //       transport.scheduleEvent(() => {
  //         invocations++;
  //       }, 0);
  //       transport.setLoopPoints(0, 100).start(0);
  //       transport.loop = true;
  //     }, 1.1).then(() => {
  //       expect(invocations).to.equal(5);
  //     });
  // });

  // it('can add parts to parts', () => {
  //   const child = new Transport();
  //   child.scheduleEvent(noOp, 0);
  //   child.scheduleEvent(noOp, 4);

  //   const parent = new Transport();
  //   parent.scheduleEvents(child, 0);
  //   parent.scheduleEvents(child, 5);

  //   expect(parent.timeline.length).to.equal(4);

  //   const expected = [0, 4, 5, 9];

  //   let i = 0;
  //   parent.timeline.forEach((item) => {
  //     expect(item.time).to.eq(expected[i++]);
  //   });
  // });

  // it('can remove a transport from a transport', () => {
  //   const child = new Transport();
  //   child.scheduleEvent(noOp, 0);
  //   child.scheduleEvent(noOp, 4);

  //   const parent = new Transport();
  //   parent.scheduleEvents(child, 0);
  //   expect(parent.timeline.length).to.equal(2);
  //   parent.removeEvents(child, 0);
  //   expect(parent.timeline.length).to.equal(0);
  // });

  // it('can add and remove from parent when events are added/removed from child', () => {
  //   const child = new Transport();
  //   const parent = new Transport();
  //   parent.scheduleEvents(child, 0);
  //   expect(parent.timeline.length).to.equal(0);


  //   const event = child.scheduleEvent(noOp, 2);
  //   expect(parent.timeline.length).to.equal(1);

  //   child.removeAtTime(2, event.event);
  //   expect(parent.timeline.length).to.equal(0);
  // });

  // it('can add/remove instances', () => {
  //   class Class {
  //     //
  //   }

  //   const transport = new Transport();
  //   const a = new Class();
  //   const b = new Class();

  //   transport.add(noOp, 5, a);
  //   transport.add(noOp, 5, b);

  //   expect(transport.timeline.length).to.eq(2);
  //   transport.remove(a); transport.remove(a);
  //   expect(transport.timeline.length).to.eq(1);
  //   transport.remove(b);
  //   expect(transport.timeline.length).to.eq(0);
  // });
});
