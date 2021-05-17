import { State as BleState } from 'react-native-ble-plx';

export const State = BleState;

export class BleManager {
  constructor() {
    this.reset();
  }

  reset() { // TODO: private
    this.characteristicListener = {};
    delete this.deviceDisconnectedListener;
    delete this.deviceScanListener;
    delete this.stateChangeListener;
    this.messageList = []; // TODO: recording
    this.nextMessageIndex = 0;
  }

  error(message) { // TODO: private
    // Note: exceptions might be swallowed by code-under-test, so we deliberately output the error here as well
    console.error(message);
    throw new Error(message);
  }

  peekMessage() { // TODO: private
    if (this.nextMessageIndex >= this.messageList.length) {
      this.error(`Assertion failed: ${this.nextMessageIndex} < ${this.messageList.length}`);
    }
    const message = this.messageList[this.nextMessageIndex];
    return message;
  }

  popMessage() { // TODO: private
    const message = this.peekMessage();
    ++this.nextMessageIndex;
    // console.trace(`popping: ${JSON.stringify(message)}`);
    return message;
  }

  expectCommand({ command, request }) { // TODO: private
    const fromMessageIndex = this.nextMessageIndex;
    this.playUntilCommand(); // Note: flush any additionally recorded events
    if (this.nextMessageIndex >= this.messageList.length) {
      this.error(`BleManagerMock: missing record for "${command}" with request\n"${JSON.stringify(request)}" since index ${fromMessageIndex}`);
    }
    const message = this.popMessage();
    const { response } = message;
    if (message.command !== command) {
      this.error(`BleManagerMock: missing record for "${command}" with request "${JSON.stringify(request)}", found ${JSON.stringify(message)} since index ${fromMessageIndex}`);
    }
    // TODO: use proper deep equal function
    if (JSON.stringify(message.request) !== JSON.stringify(request)) {
      this.error(`BleManagerMock: mismatched record for "${command}" with request\n"${JSON.stringify(request)}" but found\n"${JSON.stringify(message.request)}"`);
    }
    // console.log(`BleManagerMock: ${command} returning ${JSON.stringify(response)}`);
    return response;
  }

  mockWith(messageList) { // TODO: extract to BleManagerMock
    this.reset();
    this.messageList = messageList;
  }

  playNext() { // TODO: extract to BleManagerMock
    const message = this.popMessage();
    const { args, command, event, label, type } = message;
    if (type === 'label') {
      console.log(`(BleManagerMock: unused label: "${label}")`);
    } else if (type === 'event') {
      switch (event) {
        case 'characteristic': {
          const { characteristic, error } = args;
          const { serviceUUID, characteristicUUID, value } = characteristic;
          const characteristicListener = (this.characteristicListener[serviceUUID] || {})[characteristicUUID];
          if (characteristicListener) {
            try { // Note: report exceptions in handlers
              const result = characteristicListener(error, { serviceUUID, uuid: characteristicUUID, value });
              Promise.resolve(result).catch(console.error); // Note: handle async exception
            } catch (err) {
              console.error(err); // Note: handle sync exception
            }
          } else {
            console.log(this.characteristicListener, { serviceUUID, characteristicUUID });
            console.warn(`BleManagerMock: message cannot be delivered, as bleManager.monitorCharacteristicForDevice has not yet been called: ${JSON.stringify(message)} or subscription was removed`);
          }
          break;
        }
        case 'deviceScan': {
          const { deviceScanListener } = this;
          if (deviceScanListener) {
            const { device, error } = args;
            deviceScanListener(error, device);
            // TODO: report sync/async exception in listener
          } else {
            console.warn(`BleManagerMock: message cannot be delivered, as bleManager.startDeviceScan has not yet been called: ${JSON.stringify(message)}`);
          }
          break;
        }
        case 'stateChange': {
          const { stateChangeListener } = this;
          if (stateChangeListener) {
            const { powerState } = args;
            stateChangeListener(powerState);
            // TODO: report sync/async exception in listener
          } else {
            console.warn(`BleManagerMock: message cannot be delivered, as bleManager.onStateChange has not yet been called: ${JSON.stringify(message)}`);
          }
          break;
        }
        default:
          throw new Error(`BleManagerMock: Unrecognized event "${event}" in message ${JSON.stringify(message)}`);
      }
    } else if (type === 'command') {
      throw new Error(`BleManagerMock: command "${command}" expected but has not yet been called: ${JSON.stringify(message)}`);
    } else if (type === 'label') {
      // TODO: silent skip extra labels??
      throw new Error(`BleManagerMock: missing playUntil('${label}'): ${JSON.stringify(message)}`);
    } else {
      throw new Error(`BleManagerMock: Unrecognized type "${type}": ${JSON.stringify(message)}`);
    }
  }

  playUntilCommand() { // TODO: extract to BleManagerMock
    try {
      while (true) {
        if (this.nextMessageIndex >= this.messageList.length) {
          break;
        }
        const message = this.peekMessage();
        if (message.type === 'command' && message.command) {
          break;
        }
        this.playNext();
      }
    } catch (err) {
      console.error(err);
      this.error(`BleManagerMock: failed to playUntilCommand(): ${err.message}`);
    }
  }

  playUntil(label) { // TODO: extract to BleManagerMock
    try {
      const fromMessageIndex = this.nextMessageIndex;
      while (true) {
        if (this.nextMessageIndex >= this.messageList.length) {
          throw new Error(`BleManagerMock: label "${label}" not found in recording since index ${fromMessageIndex}`);
        }
        const message = this.peekMessage();
        if (message.type === 'label' && message.label === label) {
          this.popMessage();
          break;
        }
        this.playNext();
      }
    } catch (err) {
      console.error(err);
      this.error(`BleManagerMock: failed to playUntil('${label}'): ${err.message}`);
    }
  }

  autoPlayEvents() { // TODO: extract to BleManagerMock
    while (true) {
      if (this.nextMessageIndex >= this.messageList.length) {
        break;
      }
      const message = this.peekMessage();
      if (message.type !== 'event') {
        break;
      }
      if (!message.autoPlay) {
        break;
      }
      this.playNext();
    }
  }

  expectFullCaptureCoverage() { // TODO: extract to BleManagerMock
    const remainingMessageCount = this.messageList.length - this.nextMessageIndex;
    if (remainingMessageCount > 0) {
      throw new Error(`Expected recording to be fully covered but last ${remainingMessageCount} messages were not played`);
    }
  }

  onStateChange(listener, emitCurrentState) {
    // TODO: error if listener alreay exists
    this.expectCommand({ command: 'onStateChange', request: { emitCurrentState } });
    this.stateChangeListener = listener;
  }

  startDeviceScan(uuidList, scanOptions, listener) {
    // TODO: error if listener alreay exists
    this.expectCommand({ command: 'startDeviceScan', request: { uuidList, scanOptions } });
    this.deviceScanListener = listener;
  }

  onDeviceDisconnected(id, listener) {
    // TODO: error if listener alreay exists
    this.expectCommand({ command: 'onDeviceDisconnected', request: { id } });
    this.deviceDisconnectedListener = listener;
  }

  async state() {
    return this.expectCommand({ command: 'state', request: {} });
  }

  async isDeviceConnected(id) {
    return this.expectCommand({ command: 'isDeviceConnected', request: { id } });
  }

  async devices(deviceIdentifiers) { // TODO: auto mock instead of manual mock
    const deviceList = this.expectCommand({ command: 'devices', request: { deviceIdentifiers } });
    return deviceList.map(({ id }) => ({
      id,
      // Note: convenience wrappers can safely be implemented here and not mocked
      services: async () => this.servicesForDevice(id),
      characteristicsForService: async (serviceUUID) => this.characteristicsForDevice(id, serviceUUID),
    }));
  }

  async stopDeviceScan() {
    // TODO: if this is called from an exception handler, it can mess up the error reporting if the exception was not expected
    // this.expectCommand({ command: 'stopDeviceScan', request: {} });
  }

  async connectToDevice(id, options) {
    const response = this.expectCommand({ command: 'connectToDevice', request: { id, options } });
    return response;
  }

  async connectedDevices(serviceUUIDs) {
    const response = this.expectCommand({ command: 'connectedDevices', request: { serviceUUIDs } });
    return response;
  }

  async cancelDeviceConnection(id) {
    const device = this.expectCommand({ command: 'cancelDeviceConnection', request: { id } });
    return { id: device.id };
  }

  async discoverAllServicesAndCharacteristicsForDevice(id) {
    this.expectCommand({ command: 'discoverAllServicesAndCharacteristicsForDevice', request: { id } });
  }

  async requestMTUForDevice(id, mtu) {
    const response = this.expectCommand({ command: 'requestMTUForDevice', request: { id, mtu } });
    return response;
  }

  async servicesForDevice(id) {
    const response = this.expectCommand({ command: 'servicesForDevice', request: { id } });
    return response;
  }

  async characteristicsForDevice(id, serviceUUID) {
    const response = this.expectCommand({ command: 'characteristicsForDevice', request: { id, serviceUUID } });
    return response;
  }

  async readCharacteristicForDevice(id, serviceUUID, characteristicUUID) {
    const response = this.expectCommand({ command: 'readCharacteristicForDevice', request: { id, serviceUUID, characteristicUUID } });
    return response;
  }

  async monitorCharacteristicForDevice(id, serviceUUID, characteristicUUID, listener) {
    this.expectCommand({ command: 'monitorCharacteristicForDevice', request: { id, serviceUUID, characteristicUUID } });
    this.characteristicListener[serviceUUID] = this.characteristicListener[serviceUUID] || {};
    if (this.characteristicListener[serviceUUID][characteristicUUID]) {
      console.error(`Warning: missing call to monitorCharacteristicForDevice('${id}', '${serviceUUID}', '${characteristicUUID}).remove()`);
    }
    this.characteristicListener[serviceUUID][characteristicUUID] = listener;
    this.autoPlayEvents(); // TODO: do this on all commands??
    return {
      remove: () => {
        delete this.characteristicListener[serviceUUID][characteristicUUID];
      },
    };
  }

  async writeCharacteristicWithResponseForDevice(id, serviceUUID, characteristicUUID, value) {
    this.expectCommand({ command: 'writeCharacteristicWithResponseForDevice', request: { id, serviceUUID, characteristicUUID, value } });
    // TODO: response is characteristic
    this.autoPlayEvents(); // TODO: do this on all commands??
  }

  async readRSSIForDevice(id) {
    return { rssi: -42 }; // TODO: use capture
  }
}
