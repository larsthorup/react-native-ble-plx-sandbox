/* global describe, it */

// import mocha from '../node_modules/mocha/mocha.js';
// const { describe, it } = mocha.Mocha;
// console.log(Object.keys(mocha.Mocha));

import { expect } from 'chai';
import * as td from 'testdouble';

import { BleRecorder, BleManagerSpy } from '@larsthorup/ble-mock-recorder';

const BleManagerFake = td.constructor(BleManagerSpy);

describe('calc', () => {
  it('should add', () => {
    console.log('2 + 2 === 4');
    expect(2 + 2).to.equal(4);
  });

  it('should fail', () => {
    expect(2 / 2).to.equal(4);
  });

  it.skip('should report pending', () => { // eslint-disable-line jest/no-disabled-tests
    expect(0 / 0).to.equal(5);
  });
});

describe('state', () => {
  it('should record command with request and response', async () => {
    const captureName = 'rnMochaLauncher.test.simulated';
    const bleManagerFake = new BleManagerFake();
    const logger = (line) => console.log(line);
    const bleRecorder = new BleRecorder({ bleManager: bleManagerFake, captureName, logger });
    td.when(bleManagerFake.state()).thenResolve('some-state');
    const bleManager = bleRecorder.bleManagerSpy;
    const state = await bleManager.state();
    expect(state).to.equal('some-state');
    bleRecorder.close();
  });
});
