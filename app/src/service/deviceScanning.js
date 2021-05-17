import { blePowerStateChanged, bleDeviceScanned } from '../state';
import { getBleManager } from '../lib/ble';
import { State as BleState } from 'react-native-ble-plx';

export const deviceScanning = async (dispatch, getState) => {
  try {
    const bleManager = getBleManager();
    const uuidList = null;
    const scanOptions = null;
    bleManager.onStateChange((powerState) => {
      dispatch(blePowerStateChanged({ powerState }));
      if (powerState === BleState.PoweredOn) {
        bleManager.startDeviceScan(uuidList, scanOptions, (error, device) => {
          try {
            if (error) {
              console.error('bleManager.onDeviceScanError', error);
              return;
            }
            // Note: for now, skip devices with no name in scan response
            if (device.name) {
              // const { id, name, localName, manufacturerData, rssi } = device;
              // console.log({ id, name, localName, manufacturerData, rssi });
              dispatch(bleDeviceScanned({ device }));
            }
            // TODO: remove device
          } catch (ex) {
            console.error('bleManager.onDeviceScan exception', ex);
          }
        });
      }
    }, true);
  } catch (err) {
    console.error('deviceScanning', err);
  }
};
