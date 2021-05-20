import { after, before, describe, it } from '../lib/testRunner';
import { BleManagerCaptureControl } from '../lib/bleManagerCapture';
import * as bleService from '../lib/bleService';

const captureName = 'deviceList-empty';

describe(captureName, () => {
  let bleManager;
  let captureControl;
  const deviceMap = {
    expected: {},
    record: {},
  };

  before(() => {
    // console.log('Looking for speakers', expectedDeviceNames);
    captureControl = new BleManagerCaptureControl({ captureName, deviceMap });
    bleManager = captureControl.bleManagerCapture;
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
    captureControl.label('scanned');
  });

  after(() => {
    captureControl.close();
  });
});
