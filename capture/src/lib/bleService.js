import { State as BleState } from 'react-native-ble-plx';

// Note: eventually share with app
export const startScanning = (bleManager, listener) => {
  bleManager.onStateChange((powerState) => {
    if (powerState === BleState.PoweredOn) {
      const uuidList = null;
      const scanOptions = null;
      bleManager.startDeviceScan(uuidList, scanOptions, (error, device) => {
        // console.log('startDeviceScan', error, device.id, device.name);
        listener(error, device);
      });
    } else if (powerState === BleState.PoweredOff) {
      console.error('Phone Bluetooth is disabled');
    }
  }, true);
};
