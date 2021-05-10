import { getBleManager } from '../lib/ble';
import { assert, it } from '../lib/testRunner';
import { batteryLevelCharacteristicUuid, batteryServiceUuid } from '../lib/bleConstants';
import { base64FromUint8, uint8FromBase64 } from '../lib/base64';
import { BleManagerCapture } from '../lib/bleManagerCapture';

// TODO: before:  capture = bleManagerCapture('deviceList')
const expectedDeviceName = 'BeoPlay A1'; // TODO: configure per developer
const deviceNameEquals = deviceName => device => device.name === deviceName;
const bleManager = getBleManager();
const bleManagerCapture = new BleManagerCapture(bleManager);
bleManagerCapture.deviceCriteria = deviceNameEquals(expectedDeviceName);
bleManagerCapture.recordDevice = { id: '12-34-56-78-9A-BC', name: 'The Speaker' };
let device;

it('should receive scan result', async () => {
  // TODO: device = await expectDeviceScanResult({criteria: deviceNameEquals(expectedDeviceName)})
  device = await new Promise(resolve => {
    bleManagerCapture.onStateChange((powerState) => {
      if (powerState === 'PoweredOn') {
        const uuidList = null;
        const scanOptions = null;
        bleManagerCapture.startDeviceScan(uuidList, scanOptions, (error, d) => {
          if (!error && d.name === expectedDeviceName) {
            resolve(d);
          }
        });
      }
    }, true);
  });
  bleManagerCapture.label('scanned');
});

it('should connect to device', async () => {
  const { id } = device;
  await bleManagerCapture.connectToDevice(id);
  await bleManagerCapture.discoverAllServicesAndCharacteristicsForDevice(id);
});

it('should read battery level', async () => {
  const { id } = device;
  const services = await bleManagerCapture.servicesForDevice(id);
  assert.ok(services.find((service) => service.uuid.toLowerCase() === batteryServiceUuid.toLowerCase()));
  bleManagerCapture.recordValue = base64FromUint8(42); // TODO: inject value to record, how?
  const { value } = await bleManagerCapture.readCharacteristicForDevice(id, batteryServiceUuid, batteryLevelCharacteristicUuid);
  const batteryLevel = uint8FromBase64(value);
  console.log(`(actual batteryLevel = ${batteryLevel})`);
  assert.ok(batteryLevel >= 0, `Expected ${batteryLevel} >= 0`);
  assert.ok(batteryLevel <= 100, `Expected ${batteryLevel} <= 100`);
});

it('should read battery level again', async () => {
  const { id } = device;
  const services = await bleManagerCapture.servicesForDevice(id);
  assert.ok(services.find((service) => service.uuid.toLowerCase() === batteryServiceUuid.toLowerCase()));
  bleManagerCapture.recordValue = base64FromUint8(42); // TODO: inject value to record, how?
  const { value } = await bleManagerCapture.readCharacteristicForDevice(id, batteryServiceUuid, batteryLevelCharacteristicUuid);
  const batteryLevel = uint8FromBase64(value);
  console.log(`(actual batteryLevel = ${batteryLevel})`);
  assert.ok(batteryLevel >= 0, `Expected ${batteryLevel} >= 0`);
  assert.ok(batteryLevel <= 100, `Expected ${batteryLevel} <= 100`);
});

// TODO: after: capture.stop()
