import { Buffer } from 'buffer';
import { getBleManager } from '../lib/ble';
import { assert, it } from '../lib/testRunner';

// TODO: lib/bleConstants.js
const batteryServiceUuid = '0000180F-0000-1000-8000-00805f9b34fb';
const batteryLevelCharacteristicUuid = '00002a19-0000-1000-8000-00805f9b34fb';

// TODO: lib/base64
const uint8FromBase64 = (data) => Buffer.from(data, 'base64')[0];
const base64FromUint8 = (value) => Buffer.from([value]).toString('base64');
class BleManagerCapture {
  constructor(bm) {
    this.bleManager = bm;
  }
  record(item) {
    console.log(`BleCapture: ${JSON.stringify(item)}`);
  }
  label(label) {
    this.record({ label });
  }
  onStateChange(fn, emitCurrentState) {
    this.bleManager.onStateChange(fn, emitCurrentState);
    this.record({
      command: 'onStateChange',
      request: {
        emitCurrentState,
      },
    });
  }
  startDeviceScan(uuidList, scanOptions, listener) {
    this.bleManager.startDeviceScan(uuidList, scanOptions, (error, device) => {
      if (error) {
        const { message } = error;
        this.record({
          event: 'onDeviceScanError',
          error: { message },
        });
        listener(error, device);
      } else if (this.deviceCriteria(device)) {
        const { id, name } = this.recordDevice; // TODO: replace volatile data before capture
        // const { id, name } = device;
        this.record({
          event: 'onDeviceScan',
          device: { id, name },
        });
        listener(error, device);
      } else {
        // Note: filtered out
      }
    });
  }
  stopDeviceScan() {
    this.bleManager.stopDeviceScan();
    this.record({
      command: 'stopDeviceScan',
    });
  }
  async connectToDevice(deviceId) {
    await this.bleManager.connectToDevice(deviceId);
    const { id } = this.recordDevice; // TODO: replace volatile data before capture
    this.record({
      command: 'connectToDevice',
      request: { id },
    });
  }
  async discoverAllServicesAndCharacteristicsForDevice(deviceId) {
    await this.bleManager.discoverAllServicesAndCharacteristicsForDevice(deviceId);
    const { id } = this.recordDevice; // TODO: replace volatile data before capture
    this.record({
      command: 'discoverAllServicesAndCharacteristicsForDevice',
      request: { id },
    });
  }
  async readCharacteristicForDevice(deviceId, serviceUuid, characteristicUuid) {
    const response = await this.bleManager.readCharacteristicForDevice(
      deviceId,
      serviceUuid,
      characteristicUuid,
    );
    // const { value } = response;
    const { id } = this.recordDevice; // TODO: replace volatile data before capture
    const value = this.recordValue; // TODO: replace volatile data before capture
    this.record({
      command: 'readCharacteristicForDevice',
      request: {
        id,
        serviceUuid,
        characteristicUuid,
      },
      response: {
        value,
      },
    });
    return response;
  }
}

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
    bleManagerCapture.onStateChange(powerState => {
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
  bleManagerCapture.stopDeviceScan();
  bleManagerCapture.label('scanned');
});

it('should read battery level', async () => {
  const { id } = device;
  await bleManagerCapture.connectToDevice(id);
  await bleManagerCapture.discoverAllServicesAndCharacteristicsForDevice(id);
  bleManagerCapture.recordValue = base64FromUint8(42); // TODO: inject value to record, how?
  const { value } = await bleManagerCapture.readCharacteristicForDevice(id, batteryServiceUuid, batteryLevelCharacteristicUuid);
  const batteryLevel = uint8FromBase64(value);
  assert.ok(batteryLevel >= 0, `Expected ${batteryLevel} >= 0`);
  assert.ok(batteryLevel <= 100, `Expected ${batteryLevel} <= 100`);
});

// TODO: after: capture.stop()
