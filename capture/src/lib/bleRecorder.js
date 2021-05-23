import * as util from 'util';
import { BleManager } from 'react-native-ble-plx';
import { bufferFromBase64, isPrintableFromBase64, printableFromBase64 } from './base64';
import { stringifyBleCaptureEvent, stringifyBleRecord } from './bleCaptureJsonProtocol';

const formattedFromBase64 = (value) => {
  const valueBufferFormatted = util.format(bufferFromBase64(value));
  if (isPrintableFromBase64(value)) {
    return `${valueBufferFormatted} '${printableFromBase64(value)}'`;
  } else {
    return valueBufferFormatted;
  }
};

class BleManagerSpy {
  constructor(recorder, bleManager) {
    this._recorder = recorder;
    this._bleManager = bleManager || new BleManager();
  }

  destroy() {
    this._bleManager.destroy();
  }

  async state() {
    const state = await this._bleManager.state();
    this._recorder._record({
      type: 'command',
      command: 'state',
      request: {},
      response: state,
    });
    return state;
  }

  onStateChange(listener, emitCurrentState) {
    this._bleManager.onStateChange((powerState) => {
      this._recorder._recordEvent('stateChange', { powerState });
      listener(powerState);
    }, emitCurrentState);
    this._recorder._record({
      type: 'command',
      command: 'onStateChange',
      request: {
        emitCurrentState,
      },
    });
  }

  startDeviceScan(uuidList, scanOptions, listener) {
    this._recorder._reported = [];
    this._bleManager.startDeviceScan(uuidList, scanOptions, (error, device) => {
      if (error) {
        const { message } = error;
        this._recorder._recordEvent('deviceScan', { error: { message } });
        listener(error, device);
      } else if (device) {
        const deviceExpected = this._recorder.deviceMap.expected[device.id];
        if (deviceExpected) {
          const { recordId: id } = deviceExpected;
          const { localName, name } = this._recorder.deviceMap.record[id];
          const { manufacturerData } = device;
          this._recorder._recordEvent('deviceScan', {
            device: { id, localName, manufacturerData, name },
          });
          listener(error, device);
        } else {
          if (this._recorder._reported.indexOf(device.id) < 0) {
            this._recorder._log(`(ignoring device with id ${device.id} named ${device.name}. ManufacturerData: ${device.manufacturerData})`);
            this._recorder._reported.push(device.id);
          }
          // Note: exclude unexpected scan responses from capture file for now as they are usually quite noisy
          // TODO: use filter mechanism for this
          const { id, name } = device;
          this._recorder._exclude({
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
    this._recorder._record({
      type: 'command',
      command: 'startDeviceScan',
      request: {
        uuidList,
        scanOptions,
      },
    });
  }

  stopDeviceScan() {
    this._bleManager.stopDeviceScan();
    this._recorder._record({
      type: 'command',
      command: 'stopDeviceScan',
    });
  }

  async isDeviceConnected(deviceId) {
    const response = await this._bleManager.isDeviceConnected(deviceId);
    const { id } = this._recorder._recordDevice(deviceId);
    this._recorder._record({
      type: 'command',
      command: 'isDeviceConnected',
      request: { id },
      response,
    });
    return response;
  }

  async readRSSIForDevice(deviceId) {
    const response = await this._bleManager.readRSSIForDevice(deviceId);
    const { id } = this._recorder._recordDevice(deviceId);
    const rssi = this._recorder.recordRssi !== undefined ? this._recorder.recordRssi : response.rssi;
    this._recorder._record({
      type: 'command',
      command: 'readRSSIForDevice',
      request: { id },
      response: { id, rssi },
    });
    return response;
  }

  async connectToDevice(deviceId, options) {
    const device = await this._bleManager.connectToDevice(deviceId);
    const { id } = this._recorder._recordDevice(deviceId);
    this._recorder._record({
      type: 'command',
      command: 'connectToDevice',
      request: { id, options },
      response: { id },
    });
    return device;
  }

  async connectedDevices(serviceUUIDs) {
    const devices = await this._bleManager.connectedDevices(serviceUUIDs);
    this._recorder._record({
      type: 'command',
      command: 'connectedDevices',
      request: { serviceUUIDs },
      response: devices.map(({ id }) => ({
        id: this._recorder._recordDevice(id),
      })),
    });
    return devices;
  }

  async onDeviceDisconnected(deviceId, listener) {
    const subscription = await this._bleManager.onDeviceDisconnected(
      deviceId,
      (error, device) => {
        const { recordId: id } = this._recorder._recordDevice(deviceId);
        this._recorder._recordEvent('deviceDisconnected', {
          device: { id },
          error: error ? { message: error.message } : undefined,
        });
        listener(error, device);
      },
    );
    const { id } = this._recorder._recordDevice(deviceId);
    this._recorder._record({
      type: 'command',
      command: 'onDeviceDisconnected',
      request: {
        id,
      },
    });
    return subscription;
  }

  async requestMTUForDevice(deviceId, mtu) {
    const device = await this._bleManager.requestMTUForDevice(deviceId, mtu);
    const { id } = this._recorder._recordDevice(deviceId);
    this._recorder._record({
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
    await this._bleManager.discoverAllServicesAndCharacteristicsForDevice(deviceId);
    const { id } = this._recorder._recordDevice(deviceId);
    this._recorder._record({
      type: 'command',
      command: 'discoverAllServicesAndCharacteristicsForDevice',
      request: { id },
    });
  }

  async devices(deviceIdentifiers) {
    const deviceList = await this._bleManager.devices(deviceIdentifiers);
    this._recorder._record({
      type: 'command',
      command: 'devices',
      request: {
        deviceIdentifiers: deviceIdentifiers.map(({ id }) => this._recorder._recordDevice(id).id),
      },
      response: deviceList.map(({ id }) => this._recorder._recordDevice(id)),
    });
    return deviceList;
  }

  async servicesForDevice(deviceId) {
    const services = await this._bleManager.servicesForDevice(deviceId);
    const { id } = this._recorder._recordDevice(deviceId);
    this._recorder._record({
      type: 'command',
      command: 'servicesForDevice',
      request: { id },
      response: services.map(({ uuid }) => ({ uuid })),
    });
    return services;
  }

  async characteristicsForDevice(deviceId, serviceUUID) {
    const characteristics = await this._bleManager.characteristicsForDevice(deviceId, serviceUUID);
    const { id } = this._recorder._recordDevice(deviceId);
    this._recorder._record({
      type: 'command',
      command: 'characteristicsForDevice',
      request: { id, serviceUUID },
      response: characteristics.map(({ uuid }) => ({ uuid })),
    });
    return characteristics;
  }

  async readCharacteristicForDevice(deviceId, serviceUUID, characteristicUUID) {
    const characteristic = await this._bleManager.readCharacteristicForDevice(
      deviceId,
      serviceUUID,
      characteristicUUID,
    );
    const { id } = this._recorder._recordDevice(deviceId);
    const recordValue = this._recorder._dequeueRecordValue();
    const value = recordValue !== undefined ? recordValue : characteristic.value;
    this._recorder._record({
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
      ...(this._recorder._debugFor({ serviceUUID, characteristicUUID, value })),
    });
    return characteristic;
  }

  async monitorCharacteristicForDevice(deviceId, serviceUUID, characteristicUUID, listener) {
    const { id } = this._recorder._recordDevice(deviceId);
    const subscription = await this._bleManager.monitorCharacteristicForDevice(
      deviceId,
      serviceUUID,
      characteristicUUID,
      (error, characteristic) => {
        const { value } = characteristic;
        // Note: eventually support using recordValue, maybe stored per characteristic?
        // TODO: support filter here
        this._recorder._record({
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
          ...(this._recorder._debugFor({ serviceUUID, characteristicUUID, value })),
        });
        listener(error, characteristic);
      },
    );
    this._recorder._record({
      type: 'command',
      command: 'monitorCharacteristicForDevice',
      request: {
        id,
        serviceUUID,
        characteristicUUID,
      },
      ...(this._recorder._debugFor({ serviceUUID, characteristicUUID })),
    });
    return subscription;
  }

  async writeCharacteristicWithResponseForDevice(deviceId, serviceUUID, characteristicUUID, value) {
    const response = await this._bleManager.writeCharacteristicWithResponseForDevice(deviceId, serviceUUID, characteristicUUID, value);
    const { id } = this._recorder._recordDevice(deviceId);
    this._recorder._record({
      type: 'command',
      command: 'writeCharacteristicWithResponseForDevice',
      request: {
        id,
        serviceUUID,
        characteristicUUID,
        value,
      },
      ...(this._recorder._debugFor({ serviceUUID, characteristicUUID, value })),
    });
    return response;
  }
}

export class BleRecorder {
  constructor({ bleManager, captureName, deviceMap, logger, nameFromUuid }) {
    this.bleManagerSpy = new BleManagerSpy(this, bleManager);
    this.captureName = captureName;
    this.deviceMap = deviceMap;
    this.nameFromUuid = nameFromUuid;
    this.recordRssi = undefined;
    this.spec = {
      ['deviceScan']: { allow: Infinity, max: Infinity },
    };
    this._logger = logger || console.log;
    this._specState = {
      ['deviceScan']: { seen: 0 },
    };
    this._recordValueQueue = [];
    this._capture({ event: 'init', name: this.captureName });
  }

  _log(line) {
    this._logger(line);
  }

  _capture(captureEvent) {
    this._log(stringifyBleCaptureEvent(captureEvent));
  }

  _record(record) {
    this._log(stringifyBleRecord(record));
  }

  _recordEvent(event, args) {
    // TODO: if exclude filter call _exclude instead
    const spec = this.spec[event];
    if (spec) {
      ++this._specState[event].seen;
      if (this._specState[event].seen > spec.keep) {
        // Note: we have already seen enough of this type of event, so we will exclude this one
        this._exclude({ type: 'event', event, args });
      } else {
        // Note: we might exclude future instances of this event, so we will include the spec in this record
        this._record({ type: 'event', event, args, spec });
      }
    } else {
      this._record({ type: 'event', event, args });
    }
  }

  _exclude(item) {
    // Note: eventually support a "verbose" option for outputting these
    // this._log(`(excluding ${JSON.stringify(item)})`);
  }

  _debugFor({ serviceUUID, characteristicUUID, value }) {
    const serviceName = this.nameFromUuid[serviceUUID];
    const characteristicName = this.nameFromUuid[characteristicUUID];
    return {
      debug: {
        ...(serviceName && { serviceUUID: serviceName }),
        ...(characteristicName && { characteristicUUID: characteristicName }),
        ...(value !== undefined && { value: formattedFromBase64(value) }),
      },
    };
  }

  _recordDevice(deviceId) {
    const { recordId: id } = this.deviceMap.expected[deviceId];
    return {
      id,
      ...(this.deviceMap.record[id]),
    };
  }

  _dequeueRecordValue() {
    return this._recordValueQueue.shift();
  }

  label(label) {
    this._record({ type: 'label', label });
  }

  close() {
    this.bleManagerSpy.destroy();
    this._capture({ event: 'save', name: this.captureName });
  }

  isExpected(device) {
    return Boolean(Object.keys(this.deviceMap.expected[device.id]));
  }

  queueRecordValue(value) {
    this._recordValueQueue.push(value);
  }
}
