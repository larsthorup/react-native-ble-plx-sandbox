import * as bleService from '../shared/bleService';
import { characteristic, nameFromUuid, service } from '../shared/bleConstants';

import * as assert from '../lib/assert';
import { after, before, describe, it } from '../lib/testRunner';
import { base64FromUint8, uint8FromBase64 } from '../lib/base64';
import { BleManagerCaptureControl } from '../lib/bleManagerCapture';

const captureName = 'deviceList';

describe(captureName, () => {
  let bleManager;
  let captureControl;
  let device;
  const deviceMap = {
    expected: {
      '00:12:6F:BA:A7:74': {
        name: 'BeoPlay A1',
        recordId: '12-34-56-78-9A-BC',
      },
    },
    record: {
      '12-34-56-78-9A-BC': {
        name: 'The Speaker',
      },
    },
  };

  before(() => {
    // console.log('Looking for speakers', deviceMap.expected);
    captureControl = new BleManagerCaptureControl({ captureName, deviceMap, nameFromUuid });
    bleManager = captureControl.bleManagerCapture;
  });

  it('should receive scan result', async () => {
    device = await new Promise((resolve, reject) => {
      bleService.startScanning(bleManager, (error, d) => {
        if (!error && captureControl.isExpected(d)) {
          resolve(d);
        } else if (error) {
          console.log('error in startDeviceScan', error);
          reject(error);
        } else {
          console.log(`(unexpected device "${d.name}", ignoring)`);
        }
      });
    });
    captureControl.label('scanned');
  });

  it('should connect to device', async () => {
    const { id, name } = device;
    console.log(`(actual device: {id: '${id}', name: '${name}'})`);
    assert.strictEqual(name, deviceMap.expected[id].name);
    await bleManager.connectToDevice(id);
    await bleManager.discoverAllServicesAndCharacteristicsForDevice(id);
  });

  it('should read battery level', async () => {
    const { id } = device;
    const services = await bleManager.servicesForDevice(id);
    assert.ok(services.find((s) => s.uuid.toLowerCase() === service.battery.uuid.toLowerCase()));
    captureControl.queueRecordValue(base64FromUint8(42));
    const { value } = await bleManager.readCharacteristicForDevice(id, service.battery.uuid, characteristic.batteryLevel.uuid);
    const batteryLevel = uint8FromBase64(value);
    console.log(`(actual batteryLevel = ${batteryLevel})`);
    assert.ok(batteryLevel >= 0, `Expected ${batteryLevel} >= 0`);
    assert.ok(batteryLevel <= 100, `Expected ${batteryLevel} <= 100`);
  });

  it('should read signal strength', async () => {
    const { id } = device;
    captureControl.recordRssi = -42;
    const { rssi } = await bleManager.readRSSIForDevice(id);
    console.log(`(actual rssi = ${rssi})`);
    assert.ok(rssi < 0, `Expected ${rssi} < 0`);
    assert.ok(rssi >= -127, `Expected ${rssi} >= -127`);
  });

  after(() => {
    captureControl.close();
  });
});
