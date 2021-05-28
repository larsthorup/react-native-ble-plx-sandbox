import * as bleService from '../shared/bleService';

import { BleRecorder } from '@larsthorup/ble-mock-recorder';
import { BleManager } from 'react-native-ble-plx';

const captureName = 'deviceList-empty';

describe(captureName, () => {
  let bleManager;
  let bleRecorder;
  const deviceMap = {
    expected: {},
    record: {},
  };

  before(() => {
    // console.log('Looking for speakers', expectedDeviceNames);
    bleRecorder = new BleRecorder({
      bleManager: new BleManager(),
      captureName,
      deviceMap,
    });
    bleManager = bleRecorder.bleManagerSpy;
  });

  it('should receive no scan results', async () => {
    const timeout = 2000;
    await new Promise((resolve, reject) => {
      setTimeout(resolve, timeout);
      bleService.startScanning(bleManager, (error, device) => {
        if (!error) {
          reject(new Error(`Expected no scan result, but got "${device.name}"`));
        } else {
          console.log('error in startDeviceScan', error);
          reject(error);
        }
      });
    });
    bleRecorder.label('scanned');
  });

  after(() => {
    bleRecorder.close();
  });
});
