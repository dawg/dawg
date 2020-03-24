import { createGain } from '@/lib/audio/gain';
import { expect } from '@/lib/testing';
import { passAudio } from '@/lib/audio/test-utils';

describe('ObeoGain', () => {

  it('can be created and disposed', () => {
    const gainNode = createGain();
    gainNode.dispose();
  });

  it('handles input and output connections', () => {
    const gainNode = createGain();
    gainNode.connect(createGain());
    createGain().connect(gainNode);
    createGain().connect(gainNode.gain);
    gainNode.dispose();
  });

  it('can set the gain value', () => {
    const gainNode = createGain();
    expect(gainNode.gain.value).to.be.closeTo(1, 0.001);
    gainNode.gain.value = 0.2;
    expect(gainNode.gain.value).to.be.closeTo(0.2, 0.001);
    gainNode.dispose();
  });

  it('can be constructed with options object', () => {
    const gainNode = createGain({
      gain: 0.4,
    });
    expect(gainNode.gain.value).to.be.closeTo(0.4, 0.001);
    gainNode.dispose();
  });

  it('can be constructed with an initial value', () => {
    const gainNode = createGain({ gain: 3 });
    expect(gainNode.gain.value).to.be.closeTo(3, 0.001);
    gainNode.dispose();
  });

  it('passes audio through', () => {
    return passAudio((input) => {
      const gainNode = createGain();
      gainNode.toDestination();
      input.connect(gainNode);
    });
  });
});
