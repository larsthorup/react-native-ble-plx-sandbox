import { BleManagerMock } from './BleManagerMock';

describe('BleManagerMock', () => {
  it('monitorCharacteristicForDevice', async () => {
    const bleManager = new BleManagerMock();
    const bleManagerPlayer = bleManager; // TODO: bleManager.player
    bleManagerPlayer.mockWith([
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
            characteristicUUID: 'some-characteristic-uuid', // TODO: uuid??
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
      bleManagerPlayer.playUntil('characteristic-received');
      subscription.remove();
    });
    expect(characteristic).toEqual({
      serviceUUID: 'some-service-uuid',
      uuid: 'some-characteristic-uuid',
      value: 'some-value',
    });
  });
});
