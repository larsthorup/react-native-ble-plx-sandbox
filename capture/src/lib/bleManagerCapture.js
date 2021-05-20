import * as util from 'util';
import { BleManager } from 'react-native-ble-plx';
import { asciiFromBase64, bufferFromBase64, isAsciiFromBase64 } from './base64';

const formattedFromBase64 = (value) => {
  const valueBufferFormatted = util.format(bufferFromBase64(value));
  if (isAsciiFromBase64(value)) {
    return `${valueBufferFormatted} '${asciiFromBase64(value)}'`;
  } else {
    return valueBufferFormatted;
  }
};

export class BleManagerCapture {
  constructor(captureControl) {
    this.captureControl = captureControl;
    this.bleManager = new BleManager();
  }
  destroy() {
    this.bleManager.destroy();
  }
  async state() {
    const state = await this.bleManager.state();
    this.captureControl.record({
      type: 'command',
      command: 'state',
      request: {},
      response: state,
    });
    return state;
  }
  onStateChange(listener, emitCurrentState) {
    this.bleManager.onStateChange((powerState) => {
      this.captureControl.record({
        type: 'event',
        event: 'stateChange',
        args: {
          powerState,
        },
      });
      listener(powerState);
    }, emitCurrentState);
    this.captureControl.record({
      type: 'command',
      command: 'onStateChange',
      request: {
        emitCurrentState,
      },
    });
  }
  startDeviceScan(uuidList, scanOptions, listener) {
    this.captureControl.reported = [];
    this.bleManager.startDeviceScan(uuidList, scanOptions, (error, device) => {
      if (error) {
        const { message } = error;
        this.captureControl.record({
          type: 'event',
          event: 'deviceScan',
          args: {
            device: undefined,
            error: { message },
          },
        });
        listener(error, device);
      } else if (device) {
        const deviceExpected = this.captureControl.deviceMap.expected[device.id];
        if (deviceExpected) {
          const { recordId: id } = deviceExpected;
          const { localName, name } = this.captureControl.deviceMap.record[id];
          const { manufacturerData } = device;
          this.captureControl.record({
            type: 'event',
            event: 'deviceScan',
            args: {
              device: { id, localName, manufacturerData, name },
              error: undefined,
            },
          });
          listener(error, device);
        } else {
          if (this.captureControl.reported.indexOf(device.id) < 0) {
            console.log(`(ignoring device with id ${device.id} named ${device.name}. ManufacturerData: ${device.manufacturerData})`);
            this.captureControl.reported.push(device.id);
          }
          // Note: exclude unexpected scan responses from capture file for now as they are usually quite noisy
          const { id, name } = device;
          this.captureControl.exclude({
            type: 'event',
            event: 'deviceScan',
            args: {
              device: { id, name },
              error: undefined,
            },
          });
        }
      }
    });
    this.captureControl.record({
      type: 'command',
      command: 'startDeviceScan',
      request: {
        uuidList,
        scanOptions,
      },
    });
  }
  stopDeviceScan() {
    this.bleManager.stopDeviceScan();
    this.captureControl.record({
      type: 'command',
      command: 'stopDeviceScan',
    });
  }
  async isDeviceConnected(deviceId) {
    const response = await this.bleManager.isDeviceConnected(deviceId);
    const { id } = this.captureControl.recordDevice(deviceId);
    this.captureControl.record({
      type: 'command',
      command: 'isDeviceConnected',
      request: { id },
      response,
    });
    return response;
  }
  async readRSSIForDevice(deviceId) {
    const response = await this.bleManager.readRSSIForDevice(deviceId);
    const { id } = this.captureControl.recordDevice(deviceId);
    const rssi = this.captureControl.recordRssi !== undefined ? this.captureControl.recordRssi : response.rssi;
    this.captureControl.record({
      type: 'command',
      command: 'readRSSIForDevice',
      request: { id },
      response: { id, rssi },
    });
    return response;
  }
  async connectToDevice(deviceId, options) {
    const device = await this.bleManager.connectToDevice(deviceId);
    const { id } = this.captureControl.recordDevice(deviceId);
    this.captureControl.record({
      type: 'command',
      command: 'connectToDevice',
      request: { id, options },
      response: { id },
    });
    return device;
  }
  async connectedDevices(serviceUUIDs) {
    const devices = await this.bleManager.connectedDevices(serviceUUIDs);
    this.captureControl.record({
      type: 'command',
      command: 'connectedDevices',
      request: { serviceUUIDs },
      response: devices.map(({ id }) => ({
        id: this.captureControl.recordDevice(id),
      })),
    });
    return devices;
  }
  async onDeviceDisconnected(deviceId, listener) {
    const subscription = await this.bleManager.onDeviceDisconnected(
      deviceId,
      (error, device) => {
        const { recordId: id } = this.captureControl.recordDevice(deviceId);
        this.captureControl.record({
          type: 'event',
          event: 'deviceDisconnected',
          args: {
            device: { id },
            error: error ? { message: error.message } : undefined,
          },
        });
        listener(error, device);
      }
    );
    const { id } = this.captureControl.recordDevice(deviceId);
    this.captureControl.record({
      type: 'command',
      command: 'onDeviceDisconnected',
      request: {
        id,
      },
    });
    return subscription;
  }
  async requestMTUForDevice(deviceId, mtu) {
    const device = await this.bleManager.requestMTUForDevice(deviceId, mtu);
    const { id } = this.captureControl.recordDevice(deviceId);
    this.captureControl.record({
      type: 'command',
      command: 'requestMTUForDevice',
      request: { id, mtu },
      response: {
        id,
        mtu: device.mtu,
      },
    });
    return device;
  }
  async discoverAllServicesAndCharacteristicsForDevice(deviceId) {
    await this.bleManager.discoverAllServicesAndCharacteristicsForDevice(deviceId);
    const { id } = this.captureControl.recordDevice(deviceId);
    this.captureControl.record({
      type: 'command',
      command: 'discoverAllServicesAndCharacteristicsForDevice',
      request: { id },
    });
  }
  async devices(deviceIdentifiers) {
    const deviceList = await this.bleManager.devices(deviceIdentifiers);
    const { id } = this.captureControl.recordDevice(deviceList[0].id); // TODO: handle when there are more than one device
    this.captureControl.record({
      type: 'command',
      command: 'devices',
      request: { deviceIdentifiers: [id] },
      response: [
        { id },
      ],
    });
    return deviceList;
  }
  async servicesForDevice(deviceId) {
    const services = await this.bleManager.servicesForDevice(deviceId);
    const { id } = this.captureControl.recordDevice(deviceId);
    this.captureControl.record({
      type: 'command',
      command: 'servicesForDevice',
      request: { id },
      response: services.map(({ uuid }) => ({ uuid })),
    });
    return services;
  }
  async characteristicsForDevice(deviceId, serviceUUID) {
    const characteristics = await this.bleManager.characteristicsForDevice(deviceId, serviceUUID);
    const { id } = this.captureControl.recordDevice(deviceId);
    this.captureControl.record({
      type: 'command',
      command: 'characteristicsForDevice',
      request: { id, serviceUUID },
      response: characteristics.map(({ uuid }) => ({ uuid })),
    });
    return characteristics;
  }
  async readCharacteristicForDevice(deviceId, serviceUUID, characteristicUUID) {
    const characteristic = await this.bleManager.readCharacteristicForDevice(
      deviceId,
      serviceUUID,
      characteristicUUID,
    );
    const { id } = this.captureControl.recordDevice(deviceId);
    const recordValue = this.captureControl.dequeueRecordValue();
    const value = recordValue !== undefined ? recordValue : characteristic.value;
    this.captureControl.record({
      type: 'command',
      command: 'readCharacteristicForDevice',
      request: {
        id,
        serviceUUID,
        characteristicUUID,
      },
      response: {
        value,
      },
      ...(this.captureControl.debugFor({ serviceUUID, characteristicUUID, value })),
    });
    return characteristic;
  }
  async monitorCharacteristicForDevice(deviceId, serviceUUID, characteristicUUID, listener) {
    const { id } = this.captureControl.recordDevice(deviceId);
    const subscription = await this.bleManager.monitorCharacteristicForDevice(
      deviceId,
      serviceUUID,
      characteristicUUID,
      (error, characteristic) => {
        const { value } = characteristic;
        // Note: eventually support using recordValue, maybe stored per characteristic?
        this.captureControl.record({
          type: 'event',
          event: 'characteristic',
          autoPlay: true,
          args: {
            characteristic: {
              serviceUUID,
              characteristicUUID,
              value,
            },
            error: error ? { message: error.message } : undefined,
          },
          ...(this.captureControl.debugFor({ serviceUUID, characteristicUUID, value })),
        });
        listener(error, characteristic);
      }
    );
    this.captureControl.record({
      type: 'command',
      command: 'monitorCharacteristicForDevice',
      request: {
        id,
        serviceUUID,
        characteristicUUID,
      },
      ...(this.captureControl.debugFor({ serviceUUID, characteristicUUID })),
    });
    return subscription;
  }
  async writeCharacteristicWithResponseForDevice(deviceId, serviceUUID, characteristicUUID, value) {
    const response = await this.bleManager.writeCharacteristicWithResponseForDevice(deviceId, serviceUUID, characteristicUUID, value);
    const { id } = this.captureControl.recordDevice(deviceId);
    this.captureControl.record({
      type: 'command',
      command: 'writeCharacteristicWithResponseForDevice',
      request: {
        id,
        serviceUUID,
        characteristicUUID,
        value,
      },
      ...(this.captureControl.debugFor({ serviceUUID, characteristicUUID, value })),
    });
    return response;
  }
}

export class BleManagerCaptureControl {
  constructor({ captureName, deviceMap }) {
    this.bleManagerCapture = new BleManagerCapture(this);
    this.captureName = captureName;
    this.deviceMap = deviceMap;
    this.recordValueQueue = [];
    this.capture({ event: 'init', name: this.captureName });
  }
  capture(item) { // TODO: private
    console.log(`BleCapture: ${JSON.stringify(item)}`);
  }
  record(record) { // TODO: private
    console.log(`BleRecord: ${JSON.stringify(record)}`);
  }
  exclude(item) { // TODO: private
    // console.log(`(excluding ${JSON.stringify(item)})`);
  }
  debugFor({ serviceUUID, characteristicUUID, value }) { // TODO: private
    const serviceName = this.serviceNameMap[serviceUUID];
    const characteristicName = (this.characteristicNameMap[serviceUUID] || {})[characteristicUUID];
    return {
      debug: {
        ...(serviceName && { serviceUUID: serviceName }),
        ...(characteristicName && { characteristicUUID: characteristicName }),
        ...(value !== undefined && { value: formattedFromBase64(value) }),
      },
    };
  }
  recordDevice(deviceId) { // TODO: private
    const { recordId: id } = this.deviceMap.expected[deviceId];
    return {
      id,
      ...(this.deviceMap.record[id]),
    };
  }
  label(label) {
    this.record({ type: 'label', label });
  }
  close() {
    this.bleManagerCapture.destroy();
    this.capture({ event: 'save', name: this.captureName });
  }
  isExpected(device) {
    return Boolean(Object.keys(this.deviceMap.expected[device.id]));
  }
  queueRecordValue(value) {
    this.recordValueQueue.push(value);
  }
  dequeueRecordValue() { // TODO: private
    return this.recordValueQueue.shift();
  }
}
