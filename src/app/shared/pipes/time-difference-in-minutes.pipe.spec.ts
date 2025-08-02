import { TimeDifferenceInMinutesPipe } from './time-difference-in-minutes.pipe';

describe('TimeDifferenceInMinutesPipe', () => {
  it('create an instance', () => {
    const pipe = new TimeDifferenceInMinutesPipe();
    expect(pipe).toBeTruthy();
  });
});
