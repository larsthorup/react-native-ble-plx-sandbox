import deepEqual from 'deep-equal';

export class BlePlayer {
  constructor(bleManagerMock) {
    this.bleManagerMock = bleManagerMock;
    this._reset();
  }

  _reset() {
    this._characteristicListener = {};
    delete this._deviceDisconnectedListener;
    delete this._deviceScanListener;
    delete this._stateChangeListener;
    this._recording = { records: [] };
    this._nextRecordIndex = 0;
  }

  _error(message, skipThrow = false) {
    // Note: exceptions might be swallowed by code-under-test, so we deliberately output the error here as well for visibility
    console.error(message);
    if (!skipThrow) {
      throw new Error(message);
    }
  }

  _peekRecord() {
    if (this._nextRecordIndex >= this._recording.records.length) {
      this._error(`Assertion failed: ${this._nextRecordIndex} < ${this._recording.records.length}`);
    }
    const record = this._recording.records[this._nextRecordIndex];
    return record;
  }

  _popRecord() {
    const record = this._peekRecord();
    ++this._nextRecordIndex;
    // console.trace(`popping: ${JSON.stringify(record)}`);
    return record;
  }

  _sincePosition(index) {
    const itemPrefix = '\n    {';
    const recording = JSON.stringify(this._recording, null, 2);
    const position = recording.split(itemPrefix, index + 1).join(itemPrefix).length;
    const lineNumber = recording.substr(0, position).split('\n').length + 1;
    return `since line ${lineNumber} (index ${index})`;
  }

  _expectCommand({ command, request }, skipThrow = false) {
    const fromRecordIndex = this._nextRecordIndex;
    this.playUntilCommand(); // Note: flush any additionally recorded events
    if (this._nextRecordIndex >= this._recording.records.length) {
      this._error(`BleManagerMock: missing record for "${command}" with request\n"${JSON.stringify(request)}" ${this._sincePosition(fromRecordIndex)}`, skipThrow);
      return;
    }
    const record = this._popRecord();
    const { response } = record;
    if (record.command !== command) {
      this._error(`BleManagerMock: missing record for "${command}" with request "${JSON.stringify(request)}", found ${JSON.stringify(record)} ${this._sincePosition(fromRecordIndex)}`, skipThrow);
      return;
    }
    if (!deepEqual(record.request, request)) {
      this._error(`BleManagerMock: mismatched record for "${command}" with request\n"${JSON.stringify(request)}" but found\n"${JSON.stringify(record.request)}"`, skipThrow);
      return;
    }
    // console.log(`BleManagerMock: ${command} returning ${JSON.stringify(response)}`);
    return response;
  }

  _autoPlayEvents() {
    while (true) {
      if (this._nextRecordIndex >= this._recording.records.length) {
        break;
      }
      const record = this._peekRecord();
      if (record.type !== 'event') {
        break;
      }
      if (!record.autoPlay) {
        break;
      }
      this.playNext();
    }
  }

  mockWith(recording) {
    this._reset();
    this._recording = recording;
  }

  playNext() {
    const record = this._popRecord();
    const { args, command, event, label, type } = record;
    if (type === 'label') {
      console.log(`(BleManagerMock: unused label: "${label}")`);
    } else if (type === 'event') {
      switch (event) {
        case 'characteristic': {
          const { characteristic, error } = args;
          const { serviceUUID, uuid, value } = characteristic;
          const listener = (this._characteristicListener[serviceUUID] || {})[uuid];
          if (listener) {
            try {
              const characteristicMock = { serviceUUID, uuid, value };
              // Note: handle async exception
              Promise.resolve(listener(error, characteristicMock)).catch(console.error);
            } catch (err) {
              // Note: handle sync exception
              console.error(err);
            }
          } else {
            console.log(this._characteristicListener, { serviceUUID, uuid });
            console.warn(`BleManagerMock: event cannot be delivered, as bleManager.monitorCharacteristicForDevice has not yet been called: ${JSON.stringify(record)} or subscription was removed`);
          }
          break;
        }
        case 'deviceScan': {
          const { _deviceScanListener: listener } = this;
          if (listener) {
            const { device, error } = args;
            try {
              // Note: handle async exception
              Promise.resolve(listener(error, device)).catch(console.error);
            } catch (err) {
              // Note: handle sync exception
              console.error(err);
            }
          } else {
            console.warn(`BleManagerMock: event cannot be delivered, as bleManager.startDeviceScan has not yet been called: ${JSON.stringify(record)}`);
          }
          break;
        }
        case 'stateChange': {
          const { _stateChangeListener: listener } = this;
          if (listener) {
            const { powerState } = args;
            try {
              // Note: handle async exception
              Promise.resolve(listener(powerState)).catch(console.error);
            } catch (err) {
              // Note: handle sync exception
              console.error(err);
            }
          } else {
            console.warn(`BleManagerMock: event cannot be delivered, as bleManager.onStateChange has not yet been called: ${JSON.stringify(record)}`);
          }
          break;
        }
        default:
          throw new Error(`BleManagerMock: Unrecognized event "${event}" in record ${JSON.stringify(record)}`);
      }
    } else if (type === 'command') {
      throw new Error(`BleManagerMock: command "${command}" expected but has not yet been called: ${JSON.stringify(record)}`);
    } else if (type === 'label') {
      // Note: eventually consider if we should silently skip extra labels
      throw new Error(`BleManagerMock: missing playUntil('${label}'): ${JSON.stringify(record)}`);
    } else {
      throw new Error(`BleManagerMock: Unrecognized type "${type}": ${JSON.stringify(record)}`);
    }
  }

  playUntilCommand() {
    try {
      while (true) {
        if (this._nextRecordIndex >= this._recording.records.length) {
          break;
        }
        const record = this._peekRecord();
        if (record.type === 'command' && record.command) {
          break;
        }
        this.playNext();
      }
    } catch (err) {
      console.error(err);
      this._error(`BleManagerMock: failed to playUntilCommand(): ${err.message}`);
    }
  }

  playUntil(label) {
    try {
      const fromRecordIndex = this._nextRecordIndex;
      while (true) {
        if (this._nextRecordIndex >= this._recording.records.length) {
          throw new Error(`BleManagerMock: label "${label}" not found in recording ${this._sincePosition(fromRecordIndex)}`);
        }
        const record = this._peekRecord();
        if (record.type === 'label' && record.label === label) {
          this._popRecord();
          break;
        }
        this.playNext();
      }
    } catch (err) {
      console.error(err);
      this._error(`BleManagerMock: failed to playUntil('${label}'): ${err.message}`);
    }
  }

  expectFullCaptureCoverage() {
    const remainingRecordCount = this._recording.records.length - this._nextRecordIndex;
    if (remainingRecordCount > 0) {
      throw new Error(`Expected recording to be fully covered but last ${remainingRecordCount} records ${this._sincePosition(this._nextRecordIndex)} were not played`);
    }
  }
}
export class BleManagerMock {
  constructor() {
    this.blePlayer = new BlePlayer(this);
  }

  onStateChange(listener, emitCurrentState = false) {
    if (this.blePlayer._stateChangeListener) {
      this.blePlayer._error('Cannot call "onStateChange()" until calling "remove()" on previous subscription');
    }
    this.blePlayer._expectCommand({ command: 'onStateChange', request: { emitCurrentState } });
    this.blePlayer._stateChangeListener = listener;
    const subscription = {
      remove: () => { delete this.blePlayer._stateChangeListener; },
    };
    return subscription;
  }

  startDeviceScan(uuidList, scanOptions, listener) {
    if (this.blePlayer._deviceScanListener) {
      this.blePlayer._error('Cannot call "startDeviceScan()" until calling "remove()" on previous subscription');
    }
    this.blePlayer._expectCommand({ command: 'startDeviceScan', request: { uuidList, scanOptions } });
    this.blePlayer._deviceScanListener = listener;
    const subscription = {
      remove: () => { delete this.blePlayer._deviceScanListener; },
    };
    return subscription;
  }

  onDeviceDisconnected(id, listener) {
    if (this.blePlayer._deviceDisconnectedListener) {
      this.blePlayer._error('Cannot call "onDeviceDisconnected()" until calling "remove()" on previous subscription');
    }
    this.blePlayer._expectCommand({ command: 'onDeviceDisconnected', request: { id } });
    this.blePlayer._deviceDisconnectedListener = listener;
    const subscription = {
      remove: () => { delete this.blePlayer._deviceDisconnectedListener; },
    };
    return subscription;
  }

  async state() {
    return this.blePlayer._expectCommand({ command: 'state', request: {} });
  }

  async isDeviceConnected(id) {
    return this.blePlayer._expectCommand({ command: 'isDeviceConnected', request: { id } });
  }

  async devices(deviceIdentifiers) {
    const deviceList = this.blePlayer._expectCommand({ command: 'devices', request: { deviceIdentifiers } });
    return deviceList.map(({ id }) => ({
      id,
      // Note: convenience wrappers can safely be implemented here and not mocked
      services: async () => this.blePlayer.servicesForDevice(id),
      characteristicsForService: async (serviceUUID) => this.blePlayer.characteristicsForDevice(id, serviceUUID),
    }));
  }

  async stopDeviceScan() {
    // Note: if stopDeviceScan() is called from within an exception handler of the code-under-test,
    // it can mess up that error reporting, so we will skip throwing in this case.
    // Note: eventually consider if this approach needs to be generalized
    const skipThrow = true;
    this.blePlayer._expectCommand({ command: 'stopDeviceScan', request: {} }, skipThrow);
  }

  async connectToDevice(id, options) {
    const request = {
      id,
      ...(options !== undefined && { options }),
    };
    const response = this.blePlayer._expectCommand({ command: 'connectToDevice', request });
    return response;
  }

  async connectedDevices(serviceUUIDs) {
    const response = this.blePlayer._expectCommand({ command: 'connectedDevices', request: { serviceUUIDs } });
    return response;
  }

  async cancelDeviceConnection(id) {
    const device = this.blePlayer._expectCommand({ command: 'cancelDeviceConnection', request: { id } });
    return { id: device.id };
  }

  async discoverAllServicesAndCharacteristicsForDevice(id) {
    this.blePlayer._expectCommand({ command: 'discoverAllServicesAndCharacteristicsForDevice', request: { id } });
  }

  async requestMTUForDevice(id, mtu) {
    const response = this.blePlayer._expectCommand({ command: 'requestMTUForDevice', request: { id, mtu } });
    return response;
  }

  async servicesForDevice(id) {
    const response = this.blePlayer._expectCommand({ command: 'servicesForDevice', request: { id } });
    return response;
  }

  async characteristicsForDevice(id, serviceUUID) {
    const response = this.blePlayer._expectCommand({ command: 'characteristicsForDevice', request: { id, serviceUUID } });
    return response;
  }

  async readCharacteristicForDevice(id, serviceUUID, characteristicUUID) {
    const response = this.blePlayer._expectCommand({ command: 'readCharacteristicForDevice', request: { id, serviceUUID, characteristicUUID } });
    return response;
  }

  monitorCharacteristicForDevice(id, serviceUUID, characteristicUUID, listener) {
    this.blePlayer._expectCommand({ command: 'monitorCharacteristicForDevice', request: { id, serviceUUID, characteristicUUID } });
    this.blePlayer._characteristicListener[serviceUUID] = this.blePlayer._characteristicListener[serviceUUID] || {};
    if (this.blePlayer._characteristicListener[serviceUUID][characteristicUUID]) {
      console.error(`Warning: missing call to monitorCharacteristicForDevice('${id}', '${serviceUUID}', '${characteristicUUID}).remove()`);
    }
    this.blePlayer._characteristicListener[serviceUUID][characteristicUUID] = listener;
    this.blePlayer._autoPlayEvents(); // Note: eventually consider if we should do this on all commands
    return {
      remove: () => {
        if (this.blePlayer._characteristicListener[serviceUUID]) {
          delete this.blePlayer._characteristicListener[serviceUUID][characteristicUUID];
        }
      },
    };
  }

  async writeCharacteristicWithResponseForDevice(id, serviceUUID, characteristicUUID, value) {
    const characteristic = this.blePlayer._expectCommand({ command: 'writeCharacteristicWithResponseForDevice', request: { id, serviceUUID, characteristicUUID, value } });
    this.blePlayer._autoPlayEvents(); // Note: eventually consider if we should do this on all commands
    return characteristic;
  }

  async readRSSIForDevice(id) {
    const response = this.blePlayer._expectCommand({ command: 'readRSSIForDevice', request: { id } });
    return response;
  }
}
