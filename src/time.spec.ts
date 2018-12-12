import { Time } from '@/time';

it('toTransportTime', () => {
  const time = new Time(1);
  expect(time.toTransportTime()).toBe('0:0:1');
});

it('toSixteenths', () => {
  expect(new Time(5).toSixteenths()).toBe(5);
  expect(new Time(44).toSixteenths()).toBe(44);
});

it('toQuarters', () => {
  expect(new Time(5).toQuarters()).toBe(1.25);
});
