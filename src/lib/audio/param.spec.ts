import { createParam, ObeoParam } from '@/lib/audio/param';
import { expect } from '@/lib/testing';
import { runOffline } from '@/lib/audio/offline';
import { ObeoBuffer } from '@/lib/audio/audio-buffer';

describe('ObeoParam', () => {
  it('can initialize', async () => {
    await runOffline((context) => {
      let p = createParam(context.createGain().gain);
      expect(p.value).to.eq(1);
      p = createParam(context.createGain().gain, { value: 1.5 });
      expect(p.value).to.eq(1.5);
    });
  });

  it('correctly performs conversion', async () => {
    await runOffline((context) => {
      const p = createParam(context.createGain().gain, {
        toUnit: (v) => v / 4,
        fromUnit: (v) => v * 2,
      });

      p.value = 0.3;
      expect(p.value).to.eq(0.15);
    });
  });

  it('can be set', async () => {
    await runOffline((context) => {
      const param = createParam(context.createGain().gain);
      param.value = 0.5;
      expect(param.value).to.eq(0.5);
    });
  });

  describe('curves', () => {
    const sampleRate = 11025;
    function matchesOutputCurve(param: ObeoParam | undefined, outBuffer: ObeoBuffer): void {
      if (!param) {
        throw Error;
      }

      const channel = outBuffer.getChannelData(0);
      channel.forEach((sample, index) => {
        try {
          expect(param.getValueAtTime(index / sampleRate)).to.be.closeTo(sample, 0.1);
        } catch (e) {
          // tslint:disable-next-line:no-console
          console.error(`Failed at time ${index / outBuffer.sampleRate}s (${index}/${outBuffer.length}, ${outBuffer.sampleRate})`);
          throw e;
        }
      });
    }

    it('correctly handles setTargetAtTime followed by a ramp', async () => {
      let param: ObeoParam | undefined;

      // this fails on FF
      const testBuffer = await runOffline((context) => {
        const source = context.createConstantSource();
        source.connect(context.destination);
        source.start(0);
        param = createParam(source.offset);
        param.setTargetAtTime(2, 0.5, 0.1);
        expect(param.getValueAtTime(0.6)).to.be.closeTo(1.6, 0.1);
        param.linearRampToValueAtTime(0.5, 0.7);
        expect(param.getValueAtTime(0.6)).to.be.closeTo(0.75, 0.1);
      }, { duration: 1.5, channels: 1, sampleRate });

      matchesOutputCurve(param, testBuffer);
    });

    it('a mixture of scheduling curves', async () => {
      let param: ObeoParam | undefined;

      const testBuffer = await runOffline((context) => {
        const source = context.createConstantSource();
        source.connect(context.destination);
        source.start(0);
        param = createParam(source.offset, { value: 0.1 });
        param.setValueAtTime(0, 0);
        param.setValueAtTime(1, 0.1);
        param.linearRampToValueAtTime(3, 0.2);
        param.exponentialRampToValueAtTime(0.01, 0.3);
        param.setTargetAtTime(-1, 0.35, 0.2);
        param.cancelAndHoldAtTime(0.6);
        param.linearRampTo(1.1, 0.2, 0.7); // changed from rampTo
        param.exponentialRampTo(0, 0.1, 0.85);
        param.setValueAtTime(0, 1);
        expect(param.getValueAtTime(0.95)).to.closeTo(0, 0.001);
        expect(param.getValueAtTime(1)).to.eq(0);
        param.linearRampTo(1, 0.2, 1);
        param.targetRampTo(0, 0.1, 1.1);
        param.setValueAtTime(4, 1.2);
        param.cancelScheduledValues(1.2);
        param.linearRampToValueAtTime(1, 1.3);
      }, { duration: 1.5, sampleRate });

      matchesOutputCurve(param, testBuffer);
    });

    it('cancels and holds correctly with set value at time', async () => {
      await runOffline((context) => {
        const source = context.createConstantSource();
        source.connect(context.destination);
        source.start(0);
        const param = createParam(source.offset, { value: 0.05 });
        param.setValueAtTime(0.2, 0.1);

        param.cancelAndHoldAtTime(0.15);
        expect(param.getValueAtTime(0.15)).to.eq(0.2);
        expect(param.getValueAtTime(0.1)).to.eq(0.2);

        param.cancelAndHoldAtTime(0.1);
        expect(param.getValueAtTime(0.1)).to.eq(0.2);

        param.cancelAndHoldAtTime(0.1 - context.sampleTime);
        expect(param.getValueAtTime(0.1)).to.eq(0.05);
      }, { duration: 1.5, sampleRate });
    });

    it('cancels and holds correctly with ramps', async () => {
      await runOffline((context) => {
        const source = context.createConstantSource();
        source.connect(context.destination);
        source.start(0);
        const param = createParam(source.offset, { value: 0 });
        param.linearRampToValueAtTime(0.2, 0.1);

        param.cancelAndHoldAtTime(0.05);
        expect(param.getValueAtTime(0.025)).to.eq(0.05);
        expect(param.getValueAtTime(0.05)).to.eq(0.1);
        expect(param.getValueAtTime(0.1)).to.eq(0.1);
      }, { duration: 1.5, sampleRate });
    });
  });
});
