import { deviceScanned } from './store';
import getBleManager from './ble';

export const deviceScanning = async (dispatch, getState) => {
  const bleManager = getBleManager();
  const uuidList = null;
  const scanOptions = null;
  bleManager.startDeviceScan(uuidList, scanOptions, (error, device) => {
    try {
      if (error) {
        console.error('bleManager.onDeviceScanError', error);
        return;
      }
      if (device.name) {
        // console.log('bleManager.onDeviceScan', device.name);
        dispatch(deviceScanned({ device }));
      }
      // TODO: remove device
    } catch (ex) {
      console.error('bleManager.onDeviceScan exception', ex);
    }
  });
};
