import { createClock } from '@/lib/audio/clock';
import { expect, whenBetween } from '@/lib/testing';
import { runOffline, atTime } from '@/lib/audio/offline';

describe('ObeoClock', () => {
  it('constructs correctly', () => {
    const clock = createClock(() =>  ({}), { frequency: 1 });
    expect(clock.frequency.offset.value).to.eq(1);
    clock.frequency.offset.value = 2;
    expect(clock.frequency.offset.value).to.eq(2);
  });

  context('State', () => {

    it('correctly returns the scheduled play state', () => {
      return runOffline((offline) => {
        const clock = createClock();
        expect(clock.state.value).to.equal('stopped');
        clock.start(0).stop(0.2);
        expect(clock.state.value).to.equal('started');

        offline.onDidTick(() => {
          const time = offline.now();
          whenBetween(time, 0, 0.2, () => {
            expect(clock.state.value).to.equal('started');
          });

          whenBetween(time, 0.2, Infinity, () => {
            expect(clock.state.value).to.equal('stopped');
          });
        });
      }, { duration: 0.3 });
    });

    it('can start, pause, and stop', () => {
      return runOffline(() => {
        const clock = createClock();
        expect(clock.state.value).to.equal('stopped');
        clock.start(0).pause(0.2).stop(0.4);
        expect(clock.state.value).to.equal('started');

        return (time) => {
          whenBetween(time, 0, 0.2, () => {
            expect(clock.state.value).to.equal('started');
          });

          whenBetween(time, 0.2, 0.4, () => {
            expect(clock.state.value).to.equal('paused');
          });

          whenBetween(time, 0.4, Infinity, () => {
            expect(clock.state.value).to.equal('stopped');
          });
        };

      }, { duration: 0.5 });
    });

    it('can schedule multiple start and stops', () => {
      return runOffline(() => {
        const clock = createClock();
        expect(clock.state.value).to.equal('stopped');
        clock.start(0).pause(0.1).stop(0.2).start(0.3).stop(0.4);
        expect(clock.state.value).to.equal('started');

        return (time) => {
          whenBetween(time, 0.1, 0.2, () => {
            expect(clock.state.value).to.equal('paused');
            expect(clock.ticks.value).to.be.greaterThan(0);
          });
          whenBetween(time, 0.2, 0.3, () => {
            expect(clock.state.value).to.equal('stopped');
            expect(clock.ticks.value).to.equal(0);
          });
          whenBetween(time, 0.3, 0.4, () => {
            expect(clock.state.value).to.equal('started');
            expect(clock.ticks.value).to.be.greaterThan(0);
          });
        };
      }, { duration: 0.5 });
    });

    it('stop and immediately start', () => {
      return runOffline(() => {
        const clock = createClock();
        expect(clock.state.value).to.equal('stopped');
        clock.start(0).stop(0.1).start(0.1);
        expect(clock.state.value).to.equal('started');

        return (time) => {
          whenBetween(time, 0, 0.1, () => {
            expect(clock.state.value).to.equal('started');
          });

          whenBetween(time, 0.1, 0.5, () => {
            expect(clock.state.value).to.equal('started');
          });
        };

      }, { duration: 0.5 });
    });
  });

  context('Scheduling', () => {
    it('passes a time to the callback', (done) => {
      runOffline(() => {
        const clock = createClock((time) => {
          expect(typeof time).to.eq('number');
          clock.dispose();
          done();
        }, 10).start();
      });
    });

    it('invokes the callback with a time great than now', (done) => {
      runOffline((offline) => {
        const clock = createClock((time) => {
          clock.dispose();
          expect(time).to.be.greaterThan(now);
          done();
        }, 10);
        const now = offline.now();
        const startTime = now + 0.05;
        clock.start(startTime);
      });
    });

    it('invokes the first callback at the given start time', (done) => {
      runOffline((offline) => {
        const clock = createClock((time) => {
          clock.dispose();
          expect(time).to.be.closeTo(startTime, 0.01);
          done();
        }, 10);
        const startTime = offline.now() + 0.05;
        clock.start(startTime);
      });
    });

    it('can be scheduled to start in the future', () => {
      let invocations = 0;
      return runOffline(() => {
        createClock(() => {
          invocations++;
        }, 2).start(0.1);
      }, { duration: 0.4 }).then(() => {
        expect(invocations).to.equal(1);
      });
    });

    it('invokes the right number of callbacks given the duration', () => {
      let invokations = 0;
      return runOffline(() => {
        createClock((time) => {
          invokations++;
        }, 10).start(0).stop(0.45);
      }, { duration: 0.6 }).then(() => {
        expect(invokations).to.equal(5);
      });
    });

    it('can schedule the frequency of the clock', () => {
      let invokations = 0;
      return runOffline(() => {
        const clock = createClock((time, ticks) => {
          invokations++;
        }, 2);
        clock.start(0).stop(1.01);
        clock.frequency.offset.setValueAtTime(4, 0.5);
      }, { duration: 2 }).then(() => {
        expect(invokations).to.equal(4);
      });
    });

  });

  // context("Seconds", () => {

  // 	it("can set the current seconds", () => {
  // 		return runOffline(() => {
  // 			const clock = createClock(() => ({}), 10);
  // 			expect(clock.seconds).to.be.closeTo(0, 0.001);
  // 			clock.seconds = 3;
  // 			expect(clock.seconds).to.be.closeTo(3, 0.01);
  // 			clock.dispose();
  // 		});
  // 	});

  // 	it("can get the seconds", () => {
  // 		return runOffline(() => {
  // 			const clock = createClock(() => ({}), 10);
  // 			expect(clock.seconds).to.be.closeTo(0, 0.001);
  // 			clock.start(0.05);
  // 			return (time) => {
  // 				if (time > 0.05) {
  // 					expect(clock.seconds).to.be.closeTo(time - 0.05, 0.01);
  // 				}
  // 			};
  // 		}, 0.1);
  // 	});

  // 	it("can get the seconds during a bpm ramp", () => {
  // 		return runOffline(() => {
  // 			const clock = createClock(() => ({}), 10);
  // 			expect(clock.seconds).to.be.closeTo(0, 0.001);
  // 			clock.start(0.05);
  // 			clock.frequency.linearRampTo(60, 0.5, 0.5);
  // 			return (time) => {
  // 				if (time > 0.05) {
  // 					expect(clock.seconds).to.be.closeTo(time - 0.05, 0.01);
  // 				}
  // 			};
  // 		}, 0.7);
  // 	});

  // 	it("can set seconds during a bpm ramp", () => {
  // 		return runOffline(() => {
  // 			const clock = createClock(() => ({}), 10);
  // 			expect(clock.seconds).to.be.closeTo(0, 0.001);
  // 			clock.start(0.05);
  // 			clock.frequency.linearRampTo(60, 0.5, 0.5);
  // 			const changeSeconds = atTime(0.4, () => {
  // 				clock.seconds = 0;
  // 			});
  // 			return (time) => {
  // 				changeSeconds(time);
  // 				if (time > 0.05 && time < 0.4) {
  // 					expect(clock.seconds).to.be.closeTo(time - 0.05, 0.01);
  // 				} else if (time > 0.4) {
  // 					expect(clock.seconds).to.be.closeTo(time - 0.4, 0.01);
  // 				}
  // 			};
  // 		}, 0.7);
  // 	});
  // });

  context('ticks', () => {

    it('has 0 ticks when first created', () => {
      const clock = createClock();
      expect(clock.ticks.value).to.equal(0);
      clock.dispose();
    });

    it('can set the ticks', () => {
      const clock = createClock();
      expect(clock.ticks.value).to.equal(0);
      clock.ticks.value = 10;
      expect(clock.ticks.value).to.equal(10);
      clock.dispose();
    });

    it('increments 1 tick per callback', () => {
      return runOffline(() => {
        let ticks = 0;
        const clock = createClock(() => {
          ticks++;
        }, 2).start();
        return atTime(0.59, () => {
          expect(ticks).to.equal(clock.ticks.value);
        });
      }, { duration: 0.6 });
    });

    it('resets ticks on stop', () => {
      return runOffline(() => {
        const clock = createClock(() => ({}), 20).start(0).stop(0.1);
        return (time) => {
          whenBetween(time, 0.01, 0.09, () => {
            expect(clock.ticks.value).to.be.greaterThan(0);
          });
          whenBetween(time, 0.1, Infinity, () => {
            expect(clock.ticks.value).to.equal(0);
          });
        };
      }, { duration: 0.2 });
    });

    it('does not reset ticks on pause but stops incrementing', () => {
      return runOffline(() => {
        const clock = createClock(() => ({}), 20).start(0).pause(0.1);
        let pausedTicks = 0;
        return (time) => {
          whenBetween(time, 0.01, 0.1, () => {
            expect(clock.ticks.value).to.be.greaterThan(0);
            pausedTicks = clock.ticks.value;
          });
          whenBetween(time, 0.1, Infinity, () => {
            expect(clock.ticks.value).to.equal(pausedTicks);
          });
        };
      }, { duration: 0.2 });
    });

    it('starts incrementing where it left off after pause', () => {

      return runOffline(() => {
        const clock = createClock(() => ({}), 20).start(0).pause(0.1).start(0.2);

        let pausedTicks = 0;
        let tested = false;
        return (time) => {
          whenBetween(time, 0.01, 0.1, () => {
            expect(clock.ticks.value).to.be.greaterThan(0);
            pausedTicks = clock.ticks.value;
          });
          whenBetween(time, 0.1, 0.19, () => {
            expect(clock.ticks.value).to.equal(pausedTicks);
          });
          whenBetween(time, 0.21, Infinity, () => {
            if (!tested) {
              tested = true;
              expect(clock.ticks.value).to.equal(pausedTicks + 1);
            }
          });
        };
      }, { duration: 0.3 });
    });

    it('can start with a tick ticks', () => {
      return runOffline(() => {
        let tested = false;
        const clock = createClock((time, ticks) => {
          if (!tested) {
            tested = true;
            expect(ticks).to.equal(4);
          }
        }, 10);
        expect(clock.ticks.value).to.equal(0);
        clock.start(0);
        clock.setTicksAtTime(4, 0);
      });
    });

  });

  context('Events', () => {

    it('triggers the start event on start', (done) => {
      runOffline(() => {
        const clock = createClock(() => ({}), 20);
        const startTime = 0.3;
        clock.onDidStart(({ seconds, ticks }) => {
          expect(seconds).to.be.closeTo(startTime, 0.05);
          expect(ticks).to.equal(0);
          done();
        });
        clock.start(startTime);
      }, { duration: 0.4 });
    });

    it('triggers the start event with an ticks', (done) => {
      runOffline(() => {
        const clock = createClock(() => ({}), 20);
        const startTime = 0.3;
        clock.onDidStart(({ seconds, ticks }) => {
          expect(seconds).to.be.closeTo(startTime, 0.05);
          expect(ticks).to.equal(2);
          done();
        });
        clock.start(startTime);
        clock.setTicksAtTime(2, startTime);
      }, { duration: 0.4 });
    });

    it('triggers stop event', (done) => {
      runOffline(() => {
        const clock = createClock(() => ({}), 20);
        const stopTime = 0.3;
        clock.onDidStop(({ seconds }) => {
          expect(seconds).to.be.closeTo(stopTime, 0.05);
          done();
        });
        clock.start().stop(stopTime);
      }, { duration: 0.4 });
    });

    it('triggers pause stop event', (done) => {
      runOffline(() => {
        const clock = createClock(() => ({}), 20);
        clock.onDidPaused(({ seconds }) => {
          expect(seconds).to.be.closeTo(0.1, 0.05);
        });
        clock.onDidStop(({ seconds }) => {
          expect(seconds).to.be.closeTo(0.2, 0.05);
          done();
        });
        clock.start().pause(0.1).stop(0.2);
      }, { duration: 0.4 });
    });

    it('triggers events even in close proximity', (done) => {
      runOffline(() => {
        const clock = createClock(() => ({}), 20);
        let invokedStartEvent = false;
        clock.onDidStart(() => {
          invokedStartEvent = true;
        });
        clock.onDidStop(() => {
          expect(invokedStartEvent).to.equal(true);
          done();
        });
        clock.start(0.09999).stop(0.1);
      }, { duration: 0.4 });
    });

    // Skip these since the online AudioContext does not seem to work during tests
    it.skip('triggers \'start\' event when time is in the past', (done) => {
      const clock = createClock(() => ({}), 20);
      clock.onDidStart(() => {
        done();
        clock.dispose();
      });
      setTimeout(() => {
        clock.start(0);
      }, 100);
    });

    it.skip('triggers \'stop\' event when time is in the past', (done) => {
      const clock = createClock(() => ({}), 20);
      clock.onDidStop(() => {
        done();
        clock.dispose();
      });
      setTimeout(() => {
        clock.start(0);
      }, 100);
      setTimeout(() => {
        clock.stop(0);
      }, 200);
    });

    it.skip('triggers \'pause\' event when time is in the past', (done) => {
      const clock = createClock(() => ({}), 20);
      clock.onDidPaused(() => {
        done();
        clock.dispose();
      });
      setTimeout(() => {
        clock.start(0);
      }, 100);
      setTimeout(() => {
        clock.pause(0);
      }, 200);
    });
  });

  context('[get/set]Ticks', () => {

    it('always reports 0 if not started', () => {
      return runOffline(() => {
        const clock = createClock(() => ({}), 20);
        expect(clock.source.getTicksAtTime(0)).to.equal(0);
        expect(clock.source.getTicksAtTime(1)).to.equal(0);
        expect(clock.source.getTicksAtTime(2)).to.equal(0);
        clock.dispose();
      });
    });

    it('can get ticks in the future', () => {
      return runOffline(() => {
        const clock = createClock(() => ({}), 20);
        clock.start(1);
        expect(clock.source.getTicksAtTime(1)).to.be.closeTo(0, 0.01);
        expect(clock.source.getTicksAtTime(1.5)).to.be.closeTo(10, 0.01);
        expect(clock.source.getTicksAtTime(2)).to.be.closeTo(20, 0.01);
        clock.dispose();
      });
    });

    it('pauses on last ticks', () => {
      return runOffline(() => {
        const clock = createClock(() => ({}), 20);
        clock.start(0).pause(1);
        expect(clock.source.getTicksAtTime(0.5)).to.be.closeTo(10, 0.01);
        expect(clock.source.getTicksAtTime(1)).to.be.closeTo(20, 0.01);
        expect(clock.source.getTicksAtTime(2)).to.be.closeTo(20, 0.01);
        expect(clock.source.getTicksAtTime(3)).to.be.closeTo(20, 0.01);
        clock.dispose();
      });
    });

    it('resumes from paused position', () => {
      return runOffline(() => {
        const clock = createClock(() => ({}), 20);
        clock.start(0).pause(1).start(2);
        expect(clock.source.getTicksAtTime(0.5)).to.be.closeTo(10, 0.01);
        expect(clock.source.getTicksAtTime(1)).to.be.closeTo(20, 0.01);
        expect(clock.source.getTicksAtTime(2)).to.be.closeTo(20, 0.01);
        expect(clock.source.getTicksAtTime(3)).to.be.closeTo(40, 0.01);
        expect(clock.source.getTicksAtTime(3.5)).to.be.closeTo(50, 0.01);
        clock.dispose();
      });
    });

    it('can get tick position after multiple pauses', () => {
      return runOffline(() => {
        const clock = createClock(() => ({}), 10);
        clock.start(0).pause(1).start(2).pause(3).start(4);
        expect(clock.source.getTicksAtTime(0.5)).to.be.closeTo(5, 0.01);
        expect(clock.source.getTicksAtTime(1)).to.be.closeTo(10, 0.01);
        expect(clock.source.getTicksAtTime(2)).to.be.closeTo(10, 0.01);
        expect(clock.source.getTicksAtTime(3)).to.be.closeTo(20, 0.01);
        expect(clock.source.getTicksAtTime(4)).to.be.closeTo(20, 0.01);
        expect(clock.source.getTicksAtTime(5)).to.be.closeTo(30, 0.01);
        clock.dispose();
      });
    });

    it('can get tick position after multiple pauses and tempo scheduling', () => {
      return runOffline(() => {
        const clock = createClock(() => ({}), 10);
        clock.frequency.offset.setValueAtTime(100, 3.5);
        clock.start(0).pause(1).start(2).pause(3).start(4);
        expect(clock.source.getTicksAtTime(0.5)).to.be.closeTo(5, 0.01);
        expect(clock.source.getTicksAtTime(1)).to.be.closeTo(10, 0.01);
        expect(clock.source.getTicksAtTime(2)).to.be.closeTo(10, 0.01);
        expect(clock.source.getTicksAtTime(3)).to.be.closeTo(20, 0.01);
        expect(clock.source.getTicksAtTime(4)).to.be.closeTo(20, 0.01);
        expect(clock.source.getTicksAtTime(5)).to.be.closeTo(120, 0.01);
        clock.dispose();
      });
    });

    it('can get tick position after multiple pauses and setting ticks', () => {
      return runOffline(() => {
        const clock = createClock(() => ({}), 10);
        clock.start(0).pause(1).start(2).pause(3).start(4);
        clock.setTicksAtTime(10, 2.5);
        expect(clock.source.getTicksAtTime(0.5)).to.be.closeTo(5, 0.01);
        expect(clock.source.getTicksAtTime(1)).to.be.closeTo(10, 0.01);
        expect(clock.source.getTicksAtTime(2)).to.be.closeTo(10, 0.01);
        expect(clock.source.getTicksAtTime(3)).to.be.closeTo(15, 0.01);
        expect(clock.source.getTicksAtTime(4)).to.be.closeTo(15, 0.01);
        expect(clock.source.getTicksAtTime(5)).to.be.closeTo(25, 0.01);
        clock.dispose();
      });
    });

    it('resumes from paused position with tempo scheduling', () => {
      return runOffline(() => {
        const clock = createClock(() => ({}), 20);
        clock.start(0).pause(1).start(2);
        clock.frequency.offset.setValueAtTime(20, 0);
        clock.frequency.offset.setValueAtTime(10, 0.5);
        expect(clock.source.getTicksAtTime(0.5)).to.be.closeTo(10, 0.01);
        expect(clock.source.getTicksAtTime(1)).to.be.closeTo(15, 0.01);
        expect(clock.source.getTicksAtTime(2)).to.be.closeTo(15, 0.01);
        expect(clock.source.getTicksAtTime(3)).to.be.closeTo(25, 0.01);
        expect(clock.source.getTicksAtTime(3.5)).to.be.closeTo(30, 0.01);
        clock.dispose();
      });
    });

    it('can set a tick value at the given time', () => {
      return runOffline(() => {
        const clock = createClock(() => ({}), 20);
        clock.start(0);
        clock.setTicksAtTime(0, 1);
        clock.setTicksAtTime(0, 2);
        expect(clock.source.getTicksAtTime(0)).to.be.closeTo(0, 0.01);
        expect(clock.source.getTicksAtTime(0.5)).to.be.closeTo(10, 0.01);
        expect(clock.source.getTicksAtTime(1)).to.be.closeTo(0, 0.01);
        expect(clock.source.getTicksAtTime(1.5)).to.be.closeTo(10, 0.01);
        expect(clock.source.getTicksAtTime(2)).to.be.closeTo(0, 0.01);
        expect(clock.source.getTicksAtTime(2.5)).to.be.closeTo(10, 0.01);
        expect(clock.source.getTicksAtTime(3)).to.be.closeTo(20, 0.01);
        clock.dispose();
      });
    });

    it('can get a tick position while the frequency is scheduled with setValueAtTime', () => {
      return runOffline(() => {
        const clock = createClock(() => ({}), 20);
        clock.start(0);
        clock.frequency.offset.setValueAtTime(2, 1);
        clock.setTicksAtTime(0, 1);
        clock.setTicksAtTime(0, 2);
        expect(clock.source.getTicksAtTime(0)).to.be.closeTo(0, 0.01);
        expect(clock.source.getTicksAtTime(0.5)).to.be.closeTo(10, 0.01);
        expect(clock.source.getTicksAtTime(1)).to.be.closeTo(0, 0.01);
        expect(clock.source.getTicksAtTime(1.5)).to.be.closeTo(1, 0.01);
        expect(clock.source.getTicksAtTime(2)).to.be.closeTo(0, 0.01);
        expect(clock.source.getTicksAtTime(2.5)).to.be.closeTo(1, 0.01);
        expect(clock.source.getTicksAtTime(3)).to.be.closeTo(2, 0.01);
        clock.dispose();
      });
    });

    it('can get a tick position while the frequency is scheduled with linearRampTo', () => {
      return runOffline(() => {
        const clock = createClock(() => ({}), 20);
        clock.start(0);
        clock.frequency.offset.linearRampTo(2, 1, 1);
        clock.setTicksAtTime(0, 1);
        clock.setTicksAtTime(10, 2);
        expect(clock.source.getTicksAtTime(0)).to.be.closeTo(0, 0.01);
        expect(clock.source.getTicksAtTime(0.5)).to.be.closeTo(10, 0.01);
        expect(clock.source.getTicksAtTime(1)).to.be.closeTo(0, 0.01);
        expect(clock.source.getTicksAtTime(1.5)).to.be.closeTo(7.75, 0.01);
        expect(clock.source.getTicksAtTime(2)).to.be.closeTo(10, 0.01);
        expect(clock.source.getTicksAtTime(2.5)).to.be.closeTo(11, 0.01);
        expect(clock.source.getTicksAtTime(3)).to.be.closeTo(12, 0.01);
        clock.dispose();
      });
    });

    it('can get a tick position while the frequency is scheduled with exponentialRampTo', () => {
      return runOffline(() => {
        const clock = createClock(() => ({}), 20);
        clock.start(0);
        clock.frequency.offset.exponentialRampTo(2, 1, 1);
        clock.setTicksAtTime(0, 1);
        clock.setTicksAtTime(10, 2);
        expect(clock.source.getTicksAtTime(0)).to.be.closeTo(0, 0.01);
        expect(clock.source.getTicksAtTime(0.5)).to.be.closeTo(10, 0.01);
        expect(clock.source.getTicksAtTime(1)).to.be.closeTo(0, 0.01);
        expect(clock.source.getTicksAtTime(1.5)).to.be.closeTo(5.96, 0.01);
        expect(clock.source.getTicksAtTime(2)).to.be.closeTo(10, 0.01);
        expect(clock.source.getTicksAtTime(2.5)).to.be.closeTo(11, 0.01);
        expect(clock.source.getTicksAtTime(3)).to.be.closeTo(12, 0.01);
        clock.dispose();
      });
    });

  });
});
