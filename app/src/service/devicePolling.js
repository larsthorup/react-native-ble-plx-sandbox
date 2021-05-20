import { Buffer } from 'buffer';

import { getBleManager } from '../singleton/bleManager';
import { bleDeviceBatteryLevel, bleDeviceSignal } from '../state';


export const devicePolling = ({ id }) => async (dispatch, getState) => {
  try {
    const { polling } = getState().ble.device[id];
    if (polling) {
      const bleManager = getBleManager();
      const services = await bleManager.servicesForDevice(id);
      // console.log(services.map(service => service.uuid));
      const batteryServiceUuid = '0000180f-0000-1000-8000-00805f9b34fb';
      if (services.find((service) => service.uuid.toLowerCase() === batteryServiceUuid.toLowerCase())) {
        // const characteristics = await bleManager.characteristicsForDevice(id, batteryServiceUuid);
        // console.log(characteristics);
        const batteryLevelCharacteristicUuid = '00002a19-0000-1000-8000-00805f9b34fb';
        const batteryLevelCharacteristic = await bleManager.readCharacteristicForDevice(id, batteryServiceUuid, batteryLevelCharacteristicUuid);
        const batteryLevel = Buffer.from(batteryLevelCharacteristic.value, 'base64')[0];
        dispatch(bleDeviceBatteryLevel({ id, batteryLevel }));
      }
      const { rssi } = await bleManager.readRSSIForDevice(id);
      dispatch(bleDeviceSignal({ id, signal: rssi }));
      setTimeout(async () => {
        dispatch(devicePolling({ id }));
      }, 500); // Note: eventually use monitor characteristic for battery
    }
  } catch (err) {
    // Note: eventually report error to user
    console.error('devicePolling', err);
  }
};
