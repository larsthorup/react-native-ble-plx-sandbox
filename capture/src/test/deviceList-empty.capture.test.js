import { State as BleState } from 'react-native-ble-plx';
import { after, before, describe, it } from '../lib/testRunner';
import { BleManagerCaptureControl } from '../lib/bleManagerCapture';

const captureName = 'deviceList-empty';

describe(captureName, () => {
  let bleManager;
  let captureControl;
  const deviceMap = {
    expected: {}, // TODO: default value?
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
      // TODO: extract to shared test code, or share with app code
      bleManager.onStateChange((powerState) => {
        if (powerState === BleState.PoweredOn) {
          const uuidList = null;
          const scanOptions = null;
          bleManager.startDeviceScan(uuidList, scanOptions, (error, d) => {
            if (!error) {
              reject(new Error(`Expected no scan result, but got "${d.name}"`));
            } else {
              console.log('error in startDeviceScan', error);
              reject(error);
            }
          });
        } else if (powerState === BleState.PoweredOff) {
          console.warn('Phone Bluetooth is disabled');
          reject('Phone Bluetooth is disabled');
        }
      }, true);
    });
    captureControl.label('scanned');
  });

  after(() => {
    captureControl.close();
  });
});
