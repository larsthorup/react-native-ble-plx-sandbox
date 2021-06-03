import { expect } from 'chai';

import { BleManagerMock } from './blePlayer.js';

const version = '1.0.0';

describe(BleManagerMock.name, () => {
  it(BleManagerMock.prototype.monitorCharacteristicForDevice.name, async () => {
    const bleManager = new BleManagerMock();
    const { blePlayer } = bleManager;
    blePlayer.mockWith({
      records: [
        {
          type: 'command',
          command: 'monitorCharacteristicForDevice',
          request: {
            id: 'some-device-id',
            serviceUUID: 'some-service-uuid',
            characteristicUUID: 'some-characteristic-uuid',
          },
        },
        {
          type: 'event',
          event: 'characteristic',
          args: {
            characteristic: {
              serviceUUID: 'some-service-uuid',
              uuid: 'some-characteristic-uuid',
              value: 'some-value',
            },
          },
        },
        {
          type: 'label',
          label: 'characteristic-received',
        },
      ],
      version,
    });
    const characteristic = await new Promise((resolve, reject) => {
      const subscription = bleManager.monitorCharacteristicForDevice('some-device-id', 'some-service-uuid', 'some-characteristic-uuid', (err, c) => {
        if (err) {
          reject(err);
        } else {
          resolve(c);
        }
      });
      blePlayer.playUntil('characteristic-received');
      subscription.remove();
    });
    expect(characteristic).to.deep.equal({
      serviceUUID: 'some-service-uuid',
      uuid: 'some-characteristic-uuid',
      value: 'some-value',
    });
  });
});

describe('BlePlayer', () => {
  it('should report error by line number', async () => {
    const bleManager = new BleManagerMock();
    const { blePlayer } = bleManager;
    const recording = {
      records: [
        {
          type: 'command',
          command: 'monitorCharacteristicForDevice',
          request: {
            id: 'some-device-id',
            serviceUUID: 'some-service-uuid',
            characteristicUUID: 'some-characteristic-uuid',
          },
        },
        {
          type: 'event',
          event: 'characteristic',
          args: {
            characteristic: {
              serviceUUID: 'some-service-uuid',
              uuid: 'some-characteristic-uuid',
              value: 'some-value',
            },
          },
        },
        {
          type: 'label',
          label: 'characteristic-received',
        },
      ],
      version,
    };
    blePlayer.mockWith(recording);
    const subscription = bleManager.monitorCharacteristicForDevice('some-device-id', 'some-service-uuid', 'some-characteristic-uuid', () => { });

    const expectedLineNumber = 12;
    expect(JSON.stringify(recording, null, 2).split('\n').slice(expectedLineNumber - 1, expectedLineNumber + 2)).to.deep.equal([
      '    {',
      '      "type": "event",',
      '      "event": "characteristic",',
    ]);
    expect(() => blePlayer.expectFullCaptureCoverage()).to.throw(`Expected recording to be fully covered but last 2 records since line ${expectedLineNumber} (index 1) were not played`);
  });
});
