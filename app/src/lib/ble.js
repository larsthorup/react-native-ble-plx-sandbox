import { BleManager } from 'react-native-ble-plx';

// TODO: move to singleton/bleManager.js

const bleManager = new BleManager();

export const getBleManager = () => {
  return bleManager;
};
