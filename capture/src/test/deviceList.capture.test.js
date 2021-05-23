import { assert } from 'chai';
import '../lib/mocha';

import * as bleService from '../shared/bleService';
import { characteristic, nameFromUuid, service } from '../shared/bleConstants';

import { base64FromUint8, uint8FromBase64 } from '../lib/base64';
import { BleRecorder } from '../lib/bleRecorder';

const captureName = 'deviceList';

describe(captureName, () => {
  let bleManager;
  let bleRecorder;
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
    bleRecorder = new BleRecorder({ captureName, deviceMap, nameFromUuid });
    bleRecorder.spec.deviceScan = { keep: 1 };
    bleManager = bleRecorder.bleManagerSpy;
  });

  after(() => {
    bleRecorder.close();
  });

  it('should receive scan result', async () => {
    device = await new Promise((resolve, reject) => {
      bleService.startScanning(bleManager, (error, d) => {
        if (!error && bleRecorder.isExpected(d)) {
          resolve(d);
        } else if (error) {
          console.log('error in startDeviceScan', error);
          reject(error);
        } else {
          console.log(`(unexpected device "${d.name}", ignoring)`);
        }
      });
    });
    bleRecorder.label('scanned');
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
    bleRecorder.queueRecordValue(base64FromUint8(42));
    const { value } = await bleManager.readCharacteristicForDevice(id, service.battery.uuid, characteristic.batteryLevel.uuid);
    const batteryLevel = uint8FromBase64(value);
    console.log(`(actual batteryLevel = ${batteryLevel})`);
    assert.ok(batteryLevel >= 0, `Expected ${batteryLevel} >= 0`);
    assert.ok(batteryLevel <= 100, `Expected ${batteryLevel} <= 100`);
  });

  it('should read signal strength', async () => {
    const { id } = device;
    bleRecorder.recordRssi = -42;
    const { rssi } = await bleManager.readRSSIForDevice(id);
    console.log(`(actual rssi = ${rssi})`);
    assert.ok(rssi < 0, `Expected ${rssi} < 0`);
    assert.ok(rssi >= -127, `Expected ${rssi} >= -127`);
  });
});
