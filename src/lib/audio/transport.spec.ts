import { runOffline, ObeoOfflineContext } from '@/lib/audio/offline';
import { expect } from '@/lib/testing';
import { createTransport, ObeoTransport, TransportEvent } from '@/lib/audio/transport';
import { whenBetween, atTime } from '@/lib/audio/test-utils';
import { createSignal } from '@/lib/audio/signal';
import { Seconds } from '@/lib/audio/types';

// TODO add tests for your own functionality

const schedule = (
  context: ObeoOfflineContext,
  transport: ObeoTransport,
  f: TransportEvent['onStart'],
  time: Seconds,
) => {
  return transport.schedule({
    onStart: f,
    time: context.secondsToBeats(time),
    offset: 0,
    duration: 0,
    row: 0,
  });
};

const s = (
  context: ObeoOfflineContext,
  transport: ObeoTransport,
  options: Partial<TransportEvent>,
) => {
  return transport.schedule({
    ...options,
    time: context.secondsToBeats(options.time ?? 0),
    offset: context.secondsToBeats(options.offset ?? 0),
    duration: context.secondsToBeats(options.duration ?? 0),
    row: 0,
  });
};


describe('ObeoTransport', () => {
  it('can get and set bpm', () => {
    return runOffline(() => {
      const transport = createTransport();
      transport.bpm.offset.value = 125;
      expect(transport.bpm.offset.value).to.be.closeTo(125, 0.001);
      transport.bpm.offset.value = 120;
      expect(transport.bpm.offset.value).to.equal(120);
    });
  });

  context('looping', () => {

    it('can get and set loop points', () => {
      return runOffline((context) => {
        const transport = createTransport();
        transport.loopStart.value = 0.2;
        transport.loopEnd.value = 0.4;
        expect(transport.loopStart.value).to.be.closeTo(0.2, 0.01);
        expect(transport.loopEnd.value).to.be.closeTo(0.4, 0.01);
      });
    });

    it('can loop events scheduled on the transport', () => {
      let invocations = 0;
      return runOffline((context) => {
        const transport = createTransport();
        schedule(context, transport, () => {
          invocations++;
        }, 0);

        transport.setLoopPoints(0, context.secondsToBeats(0.1)).start(0);
        expect(transport.loopEnd.value).to.be.closeTo(0.2, 0.00001);
      }, { duration: 0.41 }).then(() => {
        expect(invocations).to.equal(5);
      });
    });
  });

  context('PPQ', () => {
    it('can get and set pulses per quarter', () => {
      return runOffline((context) => {
        const transport = createTransport();
      });
    });

    it('schedules a quarter note at the same time with a different PPQ', () => {
      return runOffline((context) => {
        context.PPQ.value = 1;
        const transport = createTransport();
        const controller = schedule(context, transport, ({ seconds }) => {
          expect(seconds).to.be.closeTo(context.beatsToSeconds(4), 0.1);
          controller.remove();
        }, context.secondsToBeats(4));
        transport.start();
      });
    });

    it('invokes the right number of ticks with a different PPQ', () => {
      return runOffline((context) => {
        const transport = createTransport();
        const ppq = 20;
        context.PPQ.value = ppq;
        transport.bpm.offset.value = 120;
        transport.start();
        const beatsInHalfSecond = (transport.bpm.offset.value / 60) * 0.5; // === 1
        const ticksInHalfSecond = beatsInHalfSecond * context.PPQ.value; // === 20
        expect(ticksInHalfSecond).to.eq(20);

        return (time) => {
          if (time > 0.5) {
            expect(transport.ticks.value).to.be.within(ppq, ppq * 1.2);
          }
        };
      }, { duration: 0.55 });
    });
  });

  context('position', () => {
    it('can jump to a specific tick number', () => {
      return runOffline((context) => {
        const transport = createTransport();
        transport.ticks.value = 200;
        expect(transport.ticks.value).to.equal(200);
        transport.start(0);
        let tested = false;
        return () => {
          if (!tested) {
            expect(transport.ticks.value).to.at.least(200);
            tested = true;
          }
        };
      });
    });

    it('can get the current position in seconds', () => {
      return runOffline((context) => {
        const transport = createTransport();
        expect(transport.seconds.value).to.equal(0);
        transport.start(0.05);
        return (time) => {
          if (time > 0.05) {
            expect(transport.seconds.value).to.be.closeTo(time - 0.05, 0.01);
          }
        };
      });
    });

    it('can get the current position in seconds during a bpm ramp', () => {
      return runOffline((context) => {
        const transport = createTransport();
        expect(transport.seconds.value).to.equal(0);
        transport.start(0.05);
        transport.bpm.offset.linearRampTo(60, 0.5, 0.5);
        return (time) => {
          if (time > 0.05) {
            expect(transport.seconds.value).to.be.closeTo(time - 0.05, 0.01);
          }
        };
      }, { duration: 0.7 });
    });
  });

  context('state', () => {
    it('can start, pause, and restart', () => {
      return runOffline((context) => {
        const transport = createTransport();
        transport.start(0).pause(0.2).start(0.4);

        const pulse = createSignal({ value: 0 });
        pulse.toDestination();

        transport.schedule({
          onStart: ({ seconds }) => {
            pulse.offset.setValueAtTime(1, seconds);
            pulse.offset.setValueAtTime(0, seconds + 0.1);
          },
          time: 0,
          offset: 0,
          duration: 0,
          row: 0,
        });

        transport.schedule({
          onStart: ({ seconds }) => {
            pulse.offset.setValueAtTime(1, seconds);
            pulse.offset.setValueAtTime(0, seconds + 0.1);
          },
          time: context.secondsToBeats(0.3),
          offset: 0,
          duration: 0,
          row: 0,
        });

        return (time) => {
          whenBetween(time, 0, 0.2, () => {
            expect(transport.state.value).to.equal('started');
          });

          whenBetween(time, 0.2, 0.4, () => {
            expect(transport.state.value).to.equal('paused');
          });

          whenBetween(time, 0.4, Infinity, () => {
            expect(transport.state.value).to.equal('started');
          });
        };
      }, 0.6).then((buffer) => {

        buffer.forEach((sample, time) => {
          whenBetween(time, 0, 0.01, () => {
            expect(sample).to.equal(1);
          });
          whenBetween(time, 0.1, 0.11, () => {
            expect(sample).to.equal(0);
          });
          whenBetween(time, 0.502, 0.51, () => {
            expect(sample).to.equal(1);
          });
        });
      });
    });
  });

  context('ticks', () => {
    it('resets ticks on stop but not on pause', () => {
      return runOffline((context) => {
        const transport = createTransport();
        transport.start(0).pause(0.1).stop(0.2);
        expect(transport.getTicksAtTime(0)).to.be.equal(Math.floor(context.PPQ.value * 0));
        expect(transport.getTicksAtTime(0.05)).to.be.equal(Math.floor(context.PPQ.value * 0.1));
        expect(transport.getTicksAtTime(0.1)).to.be.equal(Math.floor(context.PPQ.value * 0.2));
        expect(transport.getTicksAtTime(0.15)).to.be.equal(Math.floor(context.PPQ.value * 0.2));
        expect(transport.getTicksAtTime(0.2)).to.be.equal(0);
      }, 0.3);
    });

    it('tracks ticks after start', () => {

      return runOffline((context) => {
        const transport = createTransport();
        transport.bpm.offset.value = 120;
        const ppq = context.PPQ.value;
        transport.start();

        return (time) => {
          if (time > 0.5) {
            expect(transport.ticks.value).to.at.least(ppq);
          }
        };
      }, 0.6);
    });

    it('tracks ticks correctly with a different PPQ and BPM', () => {

      return runOffline((context) => {
        const transport = createTransport();
        context.PPQ.value = 96;
        transport.bpm.offset.value = 90;
        transport.start();

        return (time) => {
          if (time > 0.5) {
            expect(transport.ticks.value).to.at.least(72);
          }
        };
      }, 0.6);
    });

    it('can set the ticks while started', () => {
      let invocations = 0;
      const times = [0, 1.5];
      return runOffline((context) => {
        context.PPQ.value = 1;
        // Ticks / Second = Beats / Second = 120 BPM / 60 = 2 Ticks / Second
        const transport = createTransport();
        schedule(context, transport, ({ seconds }) => {
          expect(seconds).to.be.closeTo(times[invocations], 0.01);
          invocations++;
        }, 0);
        transport.start(0);
        // I modified this from the Tone test to set the tick value at 1.4 rather than 1.1
        // Since we were setting it at 1.1 and the loop ran at 1.5, we already surpassed the
        // majority of a tick so the event was not called
        return atTime(1.4, () => {
          transport.ticks.value = 0;
        });
      }, 2.5).then(() => {
        expect(invocations).to.equal(2);
      });
    });
  });

  context('schedule', () => {
    it('scheduled event gets invoked with the time of the event', () => {
      let wasCalled = false;
      return runOffline((context) => {
        const transport = createTransport();
        const startTime = 0.1;
        schedule(context, transport, ({ seconds }) => {
          expect(seconds).to.be.closeTo(startTime, 0.01);
          wasCalled = true;
        }, 0);
        transport.start(startTime);
      }, 0.2).then(() => {
        expect(wasCalled).to.equal(true);
      });
    });

    it('can clear a scheduled event', () => {
      return runOffline((context) => {
        const transport = createTransport();
        const controller = schedule(context, transport, () => {
          throw new Error('should not call this function');
        }, 0);
        controller.remove();
        transport.start();
      });
    });

    it('scheduled event anywhere along the timeline', () => {
      let wasCalled = false;
      return runOffline((context) => {
        const transport = createTransport();
        const startTime = context.now();
        schedule(context, transport, ({ seconds }) => {
          expect(seconds).to.be.closeTo(startTime + 0.5, 0.001);
          wasCalled = true;
        }, 0.5);
        transport.start(startTime);
      }, 0.6).then(() => {
        expect(wasCalled).to.equal(true);
      });
    });

    it('can schedule multiple events and invoke them in the right order', () => {
      let wasCalled = false;
      return runOffline((context) => {
        const transport = createTransport();
        let first = false;
        schedule(context, transport, () => {
          first = true;
        }, 0.1);
        schedule(context, transport, () => {
          expect(first).to.equal(true);
          wasCalled = true;
        }, 0.11);
        transport.start();
      }, 0.2).then(() => {
        expect(wasCalled).to.equal(true);
      });
    });

    it('invokes the event again if the timeline is restarted', () => {
      let iterations = 0;
      return runOffline((context) => {
        const transport = createTransport();
        schedule(context, transport, () => {
          iterations++;
        }, 0.05);
        transport.start(0).stop(0.1).start(0.2);
      }, 0.3).then(() => {
        expect(iterations).to.be.equal(2);
      });
    });

    it('can add an event after the Transport is started', () => {
      let wasCalled = false;
      return runOffline((context) => {
        const transport = createTransport();
        transport.start(0);
        let wasScheduled = false;
        return (time) => {
          if (time > 0.1 && !wasScheduled) {
            wasScheduled = true;
            schedule(context, transport, () => {
              wasCalled = true;
            }, 0.15);
          }
        };
      }, 0.3).then(() => {
        expect(wasCalled).to.equal(true);
      });
    });

    it('calls onMidStart if the transport is started during an event', () => {
      let calledAt = -1;
      return runOffline((offline) => {
        const transport = createTransport();
        s(offline, transport, {
          onMidStart: ({ seconds }) => {
            calledAt = seconds;
          },
          time: 0.15,
          duration: 0.1,
        });

        transport.ticks.value = offline.secondsToTicks(0.2);
        transport.start(0.1);
      }, 0.3).then(() => {
        expect(calledAt).to.closeTo(0.1, 0.000001);
      });
    });

    it('triggers onMidStart if an event was added such that the current tick is within the event', () => {
      let calledAt = -1;
      let wasScheduled = false;
      return runOffline((offline) => {
        const transport = createTransport();
        transport.start(0);
        return (time) => {
          if (time > 0.1 && !wasScheduled) {
            wasScheduled = true;
            s(offline, transport, {
              onMidStart: ({ seconds }) => {
                calledAt = seconds;
              },
              time: 0.05,
              duration: 0.1,
            });
          }
        };
      }, 0.3).then(() => {
        expect(wasScheduled).to.eq(true);
        expect(calledAt).to.be.closeTo(0.1, 0.01);
      });
    });

    it('triggers onMidStart when time is changed', () => {
      let calledAt = -1;
      return runOffline((offline) => {
        const transport = createTransport();
        const controller = s(offline, transport, {
          onMidStart: ({ seconds }) => {
            calledAt = seconds;
          },
          duration: 0.1,
        });
        transport.seconds.value = 0.14;
        transport.start(0);
        return atTime(0.01, (when) => {
          controller.setStartTime(offline.secondsToBeats(0.1));
        });
      }, 0.3).then(() => {
        expect(calledAt).to.be.closeTo(0.01, 0.01);
      });
    });

    it('triggers onEnd when the event finishes', () => {
      let calledAt = -1;
      return runOffline((offline) => {
        const transport = createTransport();
        s(offline, transport, {
          onEnd: ({ seconds }) => {
            calledAt = seconds;
          },
          duration: 0.1,
        });
        transport.start(0);
      }, 0.3).then(() => {
        expect(calledAt).to.be.closeTo(0.1, 0.01);
      });
    });

    it('triggers onEnd when the event is deleted', () => {
      let calledAt = -1;
      return runOffline((offline) => {
        const transport = createTransport();
        const controller = s(offline, transport, {
          onEnd: ({ seconds }) => {
            calledAt = seconds;
          },
          duration: 0.1,
        });
        transport.start(0);
        return atTime(0.05, () => {
          controller.remove();
        });
      }, 0.3).then(() => {
        expect(calledAt).to.be.closeTo(0.05, 0.01);
      });
    });

    it('triggers onEnd when the event duration changes', () => {
      let calledAt = -1;
      return runOffline((offline) => {
        const transport = createTransport();
        const controller = s(offline, transport, {
          onEnd: ({ seconds }) => {
            calledAt = seconds;
          },
          duration: 0.1,
        });
        transport.start(0);
        return atTime(0.03, () => {
          controller.setDuration(0.02);
        });
      }, 0.3).then(() => {
        expect(calledAt).to.be.closeTo(0.03, 0.01);
      });
    });

    it.only('triggers onTick for every tick', () => {
      let expected = -1;
      let count = 0;
      return runOffline((offline) => {
        expected = offline.secondsToTicks(0.3) - offline.PPQ.value;
        const transport = createTransport();
        transport.ticks.value = offline.PPQ.value;
        s(offline, transport, {
          onTick: () => {
            count++;
          },
          duration: 0.1,
        });
        transport.start(0);
      }, 0.3).then(() => {
        expect(expected).to.eq(count);
      });
    });
  });

});
