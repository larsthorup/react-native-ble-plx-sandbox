import { BleManager, State as BleState } from 'react-native-ble-plx';
import { after, before, describe, it } from '../lib/testRunner';
import { BleManagerCapture } from '../lib/bleManagerCapture';

describe('deviceList-empty', () => {
  let bleManager;
  let bleManagerCapture;

  before(() => {
    // console.log('Looking for speakers', expectedDeviceNames);
    // TODO: simplify to bleManagerCapture = new BleManagerCapture('deviceList'); { bleManager } = bleManagerCapture;
    bleManager = new BleManager();
    bleManagerCapture = new BleManagerCapture(bleManager, 'deviceList-empty');
    bleManagerCapture.deviceCriteria = () => false;
  });

  it('should receive no scan results', async () => {
    const timeout = 2000;
    await new Promise((resolve, reject) => {
      setTimeout(resolve, timeout);
      // TODO: extract to shared test code, or share with app code
      bleManagerCapture.onStateChange((powerState) => {
        if (powerState === BleState.PoweredOn) {
          const uuidList = null;
          const scanOptions = null;
          bleManagerCapture.startDeviceScan(uuidList, scanOptions, (error, d) => {
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
    bleManagerCapture.label('scanned');
  });

  after(() => {
    // TODO: simplify to bleManagerCapture.close();
    bleManager.destroy();
    bleManagerCapture.save();
  });
});
