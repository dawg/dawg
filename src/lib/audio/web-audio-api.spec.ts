import { expect } from '@/lib/testing';

describe('WebAudioAPI', () => {
  it('can access the API', async () => {
    const context = new AudioContext();
    await context.close();
    expect(context).to.not.be.eq(null as any);
  });
});
