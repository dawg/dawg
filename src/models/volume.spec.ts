import { percentageToGain, gainToPercentage } from '@/models/volume';
import { expect } from '@/lib/testing';

describe('volume', () => {
  it('percentageToGain works as expected', () => {
    expect(percentageToGain(0)).to.eq(-Infinity);
    expect(percentageToGain(1)).to.eq(0);
  });

  it('gainToPercentage works as expected', () => {
    expect(gainToPercentage(-Infinity)).to.eq(0);
    expect(gainToPercentage(0)).to.eq(1);
  });

  it('converts back and forth from gain', () => {
    [0, 0.2, 0.5, 0.8, 1].forEach((percentage) => {
      expect(gainToPercentage(percentageToGain(percentage))).to.be.closeTo(percentage, 0.00001);
    });
  });
});
