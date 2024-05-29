import { Subject } from './subject';

describe('Subject', () => {
  it('should create an instance', () => {
    expect(new Subject("Code", "Name", 5)).toBeTruthy();
  });
});
