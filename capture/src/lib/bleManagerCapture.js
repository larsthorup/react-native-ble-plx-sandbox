import * as util from 'util';
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
  constructor(bleManager, name) {
    this.bleManager = bleManager;
    this.name = name;
    console.log(`BleCapture: ${JSON.stringify({ event: 'init', name: this.name })}`);
  }
  record(item) { // TODO: private
    console.log(`BleRecord: ${JSON.stringify(item)}`);
  }
  exclude(item) { // TODO: private
    console.log(`(excluding ${JSON.stringify(item)})`);
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
  label(label) { // TODO: extract to BleManagerCaptureControl
    this.record({ type: 'label', label });
  }
  save() { // TODO: extract to BleManagerCaptureControl
    console.log(`BleCapture: ${JSON.stringify({ event: 'save', name: this.name })}`);
  }
  // TODO: BleManagerCaptureControl.pushRecordValue()
  // TODO: BleManagerCaptureControl.mapRecordDeviceId(actualDeviceId, recordDeviceId)
  async state() {
    const state = await this.bleManager.state();
    this.record({
      type: 'command',
      command: 'state',
      request: {},
      response: state,
    });
    return state;
  }
  onStateChange(listener, emitCurrentState) {
    this.bleManager.onStateChange((powerState) => {
      this.record({
        type: 'event',
        event: 'stateChange',
        args: {
          powerState,
        },
      });
      listener(powerState);
    }, emitCurrentState);
    this.record({
      type: 'command',
      command: 'onStateChange',
      request: {
        emitCurrentState,
      },
    });
  }
  startDeviceScan(uuidList, scanOptions, listener) {
    this.reported = [];
    this.bleManager.startDeviceScan(uuidList, scanOptions, (error, device) => {
      if (error) {
        this.record({
          type: 'event',
          event: 'deviceScan',
          args: {
            error: { message },
          },
        });
        listener(error, device);
        const { message } = error;
      } else if (this.deviceCriteria(device)) {
        const { id, localName, name } = this.recordDevice;
        const { manufacturerData } = device;
        this.record({
          type: 'event',
          event: 'deviceScan',
          args: {
            device: { id, localName, manufacturerData, name },
          },
        });
        listener(error, device);
      } else {
        if (this.reported.indexOf(device.id) < 0) {
          console.log(`(ignoring device with id ${device.id} named ${device.name}. ManufacturerData: ${device.manufacturerData})`);
          this.reported.push(device.id);
          // comment out the three next lines if they are too noisy
          // const devReport = {...device};
          // Object.keys(devReport).forEach(key => { if (key.startsWith('_')) { delete devReport[key]; }});
          // console.log(devReport);
        }
        // Note: hide unwanted scan responses for now as they are usually quite noisy
        // const { id, name } = device;
        // this.exclude({
        //   type: 'event'
        //   event: 'deviceScan',
        //   args: {
        //     device: { id, name },
        //   }
        // });
      }
    });
    this.record({
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
    this.record({
      type: 'command',
      command: 'stopDeviceScan',
    });
  }
  async isDeviceConnected(deviceId) {
    const response = await this.bleManager.isDeviceConnected(deviceId);
    const { id } = this.recordDevice;
    this.record({
      type: 'command',
      command: 'isDeviceConnected',
      request: { id },
      response,
    });
    return response;
  }
  async readRSSIForDevice(deviceId) {
    const response = await this.bleManager.readRSSIForDevice(deviceId);
    const { id } = this.recordDevice;
    const rssi = this.recordRssi !== undefined ? this.recordRssi : response.rssi;
    this.record({
      type: 'command',
      command: 'readRSSIForDevice',
      request: { id },
      response: { id, rssi },
    });
    return response;
  }
  async connectToDevice(deviceId, options) {
    const device = await this.bleManager.connectToDevice(deviceId);
    const { id } = this.recordDevice;
    this.record({
      type: 'command',
      command: 'connectToDevice',
      request: { id, options },
      response: { id },
    });
    return device;
  }
  async connectedDevices(serviceUUIDs) {
    const devices = await this.bleManager.connectedDevices(serviceUUIDs);
    const { id } = this.recordDevice;
    this.record({
      type: 'command',
      command: 'connectedDevices',
      request: { serviceUUIDs },
      response: devices.map((device) => ({ id })), // TODO: handle multiple devices
    });
    return devices;
  }
  async onDeviceDisconnected(deviceId, listener) {
    const subscription = await this.bleManager.onDeviceDisconnected(
      deviceId,
      (error, device) => {
        // TODO: record event
        // TODO: invoke listener
      }
    );
    const { id } = this.recordDevice;
    this.record({
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
    const { id } = this.recordDevice;
    this.record({
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
    const { id } = this.recordDevice;
    this.record({
      type: 'command',
      command: 'discoverAllServicesAndCharacteristicsForDevice',
      request: { id },
    });
  }
  async devices(deviceIdentifiers) {
    const deviceList = await this.bleManager.devices(deviceIdentifiers);
    const { id } = this.recordDevice; // TODO: handle when there are more than one device
    this.record({
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
    const { id } = this.recordDevice;
    this.record({
      type: 'command',
      command: 'servicesForDevice',
      request: { id },
      response: services.map(({ uuid }) => ({ uuid })),
    });
    return services;
  }
  async characteristicsForDevice(deviceId, serviceUUID) {
    const characteristics = await this.bleManager.characteristicsForDevice(deviceId, serviceUUID);
    const { id } = this.recordDevice;
    this.record({
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
    const { id } = this.recordDevice;
    const value = this.recordValue !== undefined ? this.recordValue : characteristic.value;
    this.record({
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
      ...(this.debugFor({ serviceUUID, characteristicUUID, value })),
    });
    return characteristic;
  }
  async monitorCharacteristicForDevice(deviceId, serviceUUID, characteristicUUID, listener) {
    const { id } = this.recordDevice;
    const subscription = await this.bleManager.monitorCharacteristicForDevice(
      deviceId,
      serviceUUID,
      characteristicUUID,
      (error, characteristic) => {
        const { value } = characteristic;
        this.record({
          type: 'event',
          event: 'characteristic',
          autoPlay: true,
          args: {
            characteristic: {
              serviceUUID,
              characteristicUUID,
              value,
            },
            error,
          },
          ...(this.debugFor({ serviceUUID, characteristicUUID, value })),
        });
        listener(error, characteristic);
      }
    );
    this.record({
      type: 'command',
      command: 'monitorCharacteristicForDevice',
      request: {
        id,
        serviceUUID,
        characteristicUUID,
      },
      ...(this.debugFor({ serviceUUID, characteristicUUID })),
    });
    return subscription;
  }
  async writeCharacteristicWithResponseForDevice(deviceId, serviceUUID, characteristicUUID, value) {
    const response = await this.bleManager.writeCharacteristicWithResponseForDevice(deviceId, serviceUUID, characteristicUUID, value);
    const { id } = this.recordDevice;
    this.record({
      type: 'command',
      command: 'writeCharacteristicWithResponseForDevice',
      request: {
        id,
        serviceUUID,
        characteristicUUID,
        value,
      },
      ...(this.debugFor({ serviceUUID, characteristicUUID, value })),
    });
    return response;
  }
}
