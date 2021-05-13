import { BleManager } from 'react-native-ble-plx';
import { assert, it } from '../lib/testRunner';
import { batteryLevelCharacteristicUuid, batteryServiceUuid } from '../lib/bleConstants';
import { base64FromUint8, uint8FromBase64 } from '../lib/base64';
import { BleManagerCapture } from '../lib/bleManagerCapture';

// TODO: before:  capture = bleManagerCapture('deviceList')
const expectedDeviceNames = ['BeoPlay A1', 'UE Mobile Boombox', 'Jamstack', 'JBL Charge 4']; //, '[TV] mus-UE40JU7005']; //, '4A:27:91:E1:6A:F7']; // , 'vívoactive3'];
console.log('Looking for speakers', expectedDeviceNames);
const deviceNameIn = deviceNames => device => (deviceNames.indexOf(device.name) >= 0 || deviceNames.indexOf(device.id) >= 0);
const bleManager = new BleManager();
const bleManagerCapture = new BleManagerCapture(bleManager);
bleManagerCapture.deviceCriteria = deviceNameIn(expectedDeviceNames);
bleManagerCapture.recordDevice = { id: '12-34-56-78-9A-BC', name: 'The Speaker' };
let device;

console.log('Telefonen spørger om adgang til Bluetooth');

it('should receive scan result', async () => {
  // TODO: device = await expectDeviceScanResult({criteria: deviceNameEquals(expectedDeviceName)})
  device = await new Promise((resolve, reject) => {
    bleManagerCapture.onStateChange((powerState) => {
      if (powerState === 'PoweredOn') {
        const uuidList = null;
        const scanOptions = null;
        bleManagerCapture.startDeviceScan(uuidList, scanOptions, (error, d) => {
          console.log('startDeviceScan', error, d.id, d.name);
          if (!error && deviceNameIn(expectedDeviceNames)(d)) {
            resolve(d);
          } else if (error) {
            console.log('error in startDeviceScan', error);
            reject(error);
          } else {
            console.log('other device', d.name, d);
            reject('other device ' + d.name);
          }
        });
      } else if (powerState === 'PoweredOff') {
        console.warn('Bluetooth er slukket på telefonen');
        reject('Bluetooth er slukket på telefonen');
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

// TODO: after: capture.stop()
