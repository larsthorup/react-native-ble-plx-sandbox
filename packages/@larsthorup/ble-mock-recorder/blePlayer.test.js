import { expect } from 'chai';

import { BleManagerMock } from './blePlayer.js';

describe(BleManagerMock.name, () => {
  it(BleManagerMock.prototype.monitorCharacteristicForDevice.name, async () => {
    const bleManager = new BleManagerMock();
    const { blePlayer } = bleManager;
    blePlayer.mockWith([
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
    ]);
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
