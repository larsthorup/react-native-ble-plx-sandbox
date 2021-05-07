import {getBleManager} from '../lib/ble';
import {it} from '../lib/testRunner';

// TODO: share
const batteryServiceUuid = '0000180F-0000-1000-8000-00805f9b34fb';
const batteryLevelCharacteristicUuid = '00002a19-0000-1000-8000-00805f9b34fb';

// TODO: before:  capture = bleManagerCapture('deviceList')
// TODO: before: ask user to freshly enable phone bluetooth
const bleManager = getBleManager();

const expectedDeviceName = 'BeoPlay A1'; // TODO: configure per developer

// const deviceNameEquals = deviceName => device => device.name === deviceName;

let device;

it('should receive scan result', async () => {
  // TODO: device = await expectDeviceScanResult(deviceNameEquals(expectedDeviceName))
  device = await new Promise(resolve => {
    // TODO: include as command
    bleManager.onStateChange(powerState => {
      if (powerState === 'PoweredOn') {
        const uuidList = null;
        const scanOptions = null;
        // TODO: include as command
        bleManager.startDeviceScan(uuidList, scanOptions, (error, d) => {
          // TODO: inject criteria
          if (error) {
            const {message} = error;
            console.log(
              `BleCapture: ${JSON.stringify({
                event: 'onDeviceScanError',
                error: {message},
              })}`,
            ); // TODO: capture.record
          } else if (d.name === expectedDeviceName) {
            // TODO: replace volatile data before capture
            const {id, name} = d;
            console.log(
              `BleCapture: ${JSON.stringify({
                event: 'onDeviceScan',
                device: {id, name},
              })}`,
            ); // TODO: capture.record
            resolve(d);
          }
        });
      }
    }, true);
  });
  // TODO: include as command
  bleManager.stopDeviceScan();
  console.log(`BleCapture: ${JSON.stringify({label: 'scanned'})}`); // TODO: capture.record
});

it('should read battery level', async () => {
  const {id} = device;
  // TODO: include as command
  await bleManager.connectToDevice(id);
  // TODO: include as command
  await bleManager.discoverAllServicesAndCharacteristicsForDevice(id);
  const serviceUuid = batteryServiceUuid;
  const characteristicUuid = batteryLevelCharacteristicUuid;
  const response = await bleManager.readCharacteristicForDevice(
    id,
    serviceUuid,
    characteristicUuid,
  );
  const {value} = response;
  console.log(
    `BleCapture: ${JSON.stringify({
      command: 'readCharacteristicForDevice',
      request: {
        id,
        serviceUuid,
        characteristicUuid,
      },
      response: {
        value,
      },
    })}`,
  );
});

// TODO: after: capture.stop()
