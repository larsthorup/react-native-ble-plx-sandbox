import { BleManager, State as BleState } from 'react-native-ble-plx';

import * as assert from '../lib/assert';
import { after, before, describe, it } from '../lib/testRunner';
import { batteryLevelCharacteristicUuid, batteryServiceUuid } from '../lib/bleConstants';
import { base64FromUint8, uint8FromBase64 } from '../lib/base64';
import { BleManagerCapture } from '../lib/bleManagerCapture';

const captureName = 'deviceList';

describe(captureName, () => {
  let bleManager;
  let bleManagerCapture;
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
    // TODO: simplify to bleManagerCapture = new BleManagerCapture('deviceList'); { bleManager } = bleManagerCapture;
    bleManager = new BleManager();
    bleManagerCapture = new BleManagerCapture(bleManager, { captureName, deviceMap });
    // TODO: share code with bleConstants
    bleManagerCapture.serviceNameMap = {
      [batteryServiceUuid]: 'Battery Service',
    };
    bleManagerCapture.characteristicNameMap = {
      [batteryServiceUuid]: {
        [batteryLevelCharacteristicUuid]: 'Battery Level',
      },
    };
  });

  it('should receive scan result', async () => {
    device = await new Promise((resolve, reject) => {
      bleManagerCapture.onStateChange((powerState) => {
        if (powerState === BleState.PoweredOn) {
          const uuidList = null;
          const scanOptions = null;
          // TODO: bleManagerCapture.recordCollapseScanResponse({min: 1, max: Infinity});
          bleManagerCapture.startDeviceScan(uuidList, scanOptions, (error, d) => {
            // console.log('startDeviceScan', error, d.id, d.name);
            if (!error && bleManagerCapture.isExpected(d)) {
              resolve(d);
            } else if (error) {
              console.log('error in startDeviceScan', error);
              reject(error);
            } else {
              console.log(`(unexpected device "${d.name}", ignoring)`);
            }
          });
        } else if (powerState === BleState.PoweredOff) {
          console.warn('Phone Bluetooth is disabled');
          reject('Phone Bluetooth is disabled');
        }
      }, true);
    });
    bleManagerCapture.label('scanned');
  });

  it('should connect to device', async () => {
    const { id, name } = device;
    console.log(`(actual device: {id: '${id}', name: '${name}'})`);
    assert.strictEqual(name, deviceMap.expected[id].name);
    await bleManagerCapture.connectToDevice(id);
    await bleManagerCapture.discoverAllServicesAndCharacteristicsForDevice(id);
  });

  it('should read battery level', async () => {
    const { id } = device;
    const services = await bleManagerCapture.servicesForDevice(id);
    assert.ok(services.find((service) => service.uuid.toLowerCase() === batteryServiceUuid.toLowerCase()));
    bleManagerCapture.queueRecordValue(base64FromUint8(42));
    const { value } = await bleManagerCapture.readCharacteristicForDevice(id, batteryServiceUuid, batteryLevelCharacteristicUuid);
    const batteryLevel = uint8FromBase64(value);
    console.log(`(actual batteryLevel = ${batteryLevel})`);
    assert.ok(batteryLevel >= 0, `Expected ${batteryLevel} >= 0`);
    assert.ok(batteryLevel <= 100, `Expected ${batteryLevel} <= 100`);
  });

  it('should read signal strength', async () => {
    const { id } = device;
    bleManagerCapture.recordRssi = -42;
    const { rssi } = await bleManagerCapture.readRSSIForDevice(id);
    console.log(`(actual rssi = ${rssi})`);
    assert.ok(rssi < 0, `Expected ${rssi} < 0`);
    assert.ok(rssi >= -127, `Expected ${rssi} >= -127`);
  });

  after(() => {
    // TODO: simplify to bleManagerCapture.close();
    bleManager.destroy();
    bleManagerCapture.save();
  });
});
