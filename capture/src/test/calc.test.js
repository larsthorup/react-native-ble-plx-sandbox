import { assert } from 'chai';
import '../lib/mocha';

describe('calc', () => {
  let count;

  before(() => {
    count = 0;
  });

  it('should add positive numbers', () => {
    ++count;
    assert.strictEqual(2 + 2, 4);
  });

  it('should add negative numbers', () => {
    ++count;
    assert.strictEqual(-2 + -2, -4);
  });

  it('should report failure', () => {
    ++count;
    assert.strictEqual(2 + 2, 5);
  });

  it.skip('should report pending', () => { // eslint-disable-line jest/no-disabled-tests
    ++count;
    assert.strictEqual(0 / 0, 5);
  });

  it('should await async result', async () => {
    ++count;
    const result = await new Promise(resolve => resolve(2 + 2));
    assert.strictEqual(result, 4);
  });

  after(() => {
    assert.strictEqual(count, 4);
  });
});
