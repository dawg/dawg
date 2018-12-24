import { Note, ValidateNote } from '@/models';
import io from './io';


describe('Note', () => {
  it('it should encode', () => {
    const a = {
      id: 0,
      time: 0,
      duration: 0,
      other: 99,
    };

    const result = io.encode(ValidateNote, a);
    expect(result).toEqual({id: 0, time: 0, duration: 0});
  });
});
