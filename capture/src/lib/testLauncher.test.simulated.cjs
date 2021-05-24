const { expect } = require('chai');

describe('simulated', () => {
  it('should add', () => {
    expect(2 + 2).to.equal(4);
  });

  it('should fail', () => {
    expect(2 / 2).to.equal(4);
  })
});