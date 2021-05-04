import { BleManager } from 'react-native-ble-plx';

let bleManager = null;

export const getBleManager = () => {
  if (!bleManager) {
    bleManager = new BleManager();
  }
  return bleManager;
};
