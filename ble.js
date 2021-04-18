import { BleManager } from "react-native-ble-plx";

let bleManager = null;

export default function getBleManager() {
  if (!bleManager) {
    bleManager = new BleManager();
  }
  return bleManager;
}