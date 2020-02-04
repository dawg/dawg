import { expect } from '@/testing';
import { Timeline } from '@/modules/audio/timeline';

describe(Timeline.name, () => {
  it('search works correctly', async () => {
    const timeline = new Timeline();
    expect(timeline.search(0).type).to.eq('before');

    timeline.add({ time: 1, offset: 0 });
    expect(timeline.search(0).type).to.eq('before');
    expect(timeline.search(1).type).to.eq('hit');
    expect(timeline.search(2).type).to.eq('after');

    timeline.add({ time: 1, offset: 0 });
    timeline.add({ time: 1, offset: 0 });
    timeline.add({ time: 2, offset: 0 });
    expect(timeline.search(0).type).to.eq('before');

    const r2 = timeline.search(1);
    expect(r2.type).to.eq('hit');
    if (r2.type === 'hit') {
      expect(r2.firstOccurrenceIndex).to.eq(0);
      expect(r2.lastOccurrenceIndex).to.eq(2);
    }

    expect(timeline.search(1.5).type).to.eq('between');
    expect(timeline.search(3).type).to.eq('after');
  });
});
