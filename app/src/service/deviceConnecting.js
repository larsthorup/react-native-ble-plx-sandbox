import { Buffer } from 'buffer';

import { bleDeviceBatteryLevel, bleDeviceConnecting } from '../state';
import { getBleManager } from '../lib/ble';

export const deviceConnecting = ({ id }) => async (dispatch, getState) => {
  try {
    const { connecting } = getState().ble.device[id] || {};
    if (!connecting) {
      dispatch(bleDeviceConnecting({ id, connecting: true }));
      const bleManager = getBleManager();
      // console.log('deviceConnecting - attempt connect');
      await bleManager.connectToDevice(id);
      // console.log('deviceConnecting - connected');
      await bleManager.discoverAllServicesAndCharacteristicsForDevice(id);
      // console.log('deviceConnecting - services discovered');
      // const services = await bleManager.servicesForDevice(id);
      // console.log(services.length);
      const batteryServiceUuid = '0000180F-0000-1000-8000-00805f9b34fb';
      // const characteristics = await device.characteristicsForService(batteryServiceUuid);
      // console.log(characteristics);
      const batteryLevelCharacteristicUuid = '00002a19-0000-1000-8000-00805f9b34fb';
      const batteryLevelCharacteristic = await bleManager.readCharacteristicForDevice(id, batteryServiceUuid, batteryLevelCharacteristicUuid);
      const batteryLevel = Buffer.from(batteryLevelCharacteristic.value, 'base64')[0];
      dispatch(bleDeviceConnecting({ id, connecting: false }));
      dispatch(bleDeviceBatteryLevel({ id, batteryLevel }));
      // console.log('deviceConnecting', { batteryLevel });
    }
  } catch (err) {
    console.error(err);
  }
};
