import { expect } from 'chai';
import '../lib/mocha';

describe('calc', () => {
  let count;

  before(() => {
    count = 0;
  });

  it('should add positive numbers', () => {
    ++count;
    expect(2 + 2).to.equal(4);
  });

  it('should add negative numbers', () => {
    ++count;
    expect(-2 + -2).to.equal(-4);
  });

  it('should report failure', () => {
    ++count;
    expect(2 + 2).to.equal(5);
  });

  it.skip('should report pending', () => { // eslint-disable-line jest/no-disabled-tests
    ++count;
    expect(0 / 0).to.equal(5);
  });

  it('should await async result', async () => {
    ++count;
    const result = await new Promise(resolve => resolve(2 + 2));
    expect(result).to.equal(4);
  });

  after(() => {
    expect(count).to.equal(4);
  });
});
