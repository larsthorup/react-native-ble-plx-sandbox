import {assert, it} from '../lib/testRunner';

it('should add positive numbers', () => {
  assert.strictEqual(2 + 2, 4);
});

it('should add negative numbers', () => {
  assert.strictEqual(-2 + -2, -4);
});

it('should report failure', () => {
  assert.strictEqual(2 + 2, 5);
});

it('should await async result', async () => {
  const result = await new Promise(resolve => resolve(2 + 2));
  assert.strictEqual(result, 4);
});
