import * as assert from 'assert';

export class BleManager {
  constructor() {
    this.reset();
  }

  reset() { // TODO: private
    this.messageList = []; // TODO: recording
    this.nextMessageIndex = 0;
  }

  peekMessage() { // TODO: private
    if (this.nextMessageIndex >= this.messageList.length) {
      assert.fail(`Expected ${this.nextMessageIndex} < ${this.messageList.length}`);
    }
    const message = this.messageList[this.nextMessageIndex];
    return message;
  }

  popMessage() { // TODO: private
    const message = this.peekMessage();
    ++this.nextMessageIndex;
    // console.log(`popping: ${JSON.stringify(message)}`);
    return message;
  }

  async expectCommand({ command, request }) { // TODO: private
    this.playUntilCommand(); // Note: flush any additionally recorded events
    const message = this.popMessage();
    const { response } = message;
    if (message.command !== command) {
      console.error(`BleManagerMock: expected command "${command}" but found ${JSON.stringify(message)}`);
    }
    // TODO: use proper deep equal function
    if (JSON.stringify(message.request) !== JSON.stringify(request)) {
      console.error(`BleManagerMock: expected command "${command}" to have request\n"${JSON.stringify(request)}" but found\n"${JSON.stringify(message.request)}"`);
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
        case 'deviceScan':
          const { deviceScanListener } = this;
          if (deviceScanListener) {
            const { device, error } = args;
            deviceScanListener(error, device);
          } else {
            console.warn(`BleManagerMock: message cannot be delivered, as bleManager.startDeviceScan has not yet been called: ${JSON.stringify(message)}`);
          }
          break;
        case 'stateChange':
          const { stateChangeListener } = this;
          if (stateChangeListener) {
            const { powerState } = args;
            stateChangeListener(powerState);
          } else {
            console.warn(`BleManagerMock: message cannot be delivered, as bleManager.onStateChange has not yet been called: ${JSON.stringify(message)}`);
          }
          break;
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
      const fromMessageIndex = this.nextMessageIndex;
      while (true) {
        if (this.nextMessageIndex >= this.messageList.length) {
          throw new Error(`BleManagerMock: command not found in recording since index ${fromMessageIndex}`);
        }
        const message = this.peekMessage();
        if (message.type === 'command' && message.command) {
          break;
        }
        this.playNext();
      }
    } catch (err) {
      console.error(err);
      throw new Error(`BleManagerMock: failed to playUntilCommand(): ${err.message}`);
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
      throw new Error(`BleManagerMock: failed to playUntil('${label}'): ${err.message}`);
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

  stopDeviceScan() { }

  async connectToDevice(id) {
    this.expectCommand({ command: 'connectToDevice', request: { id } });
  }

  async discoverAllServicesAndCharacteristicsForDevice(id) {
    this.expectCommand({ command: 'discoverAllServicesAndCharacteristicsForDevice', request: { id } });
  }

  async servicesForDevice(id) {
    const response = this.expectCommand({ command: 'servicesForDevice', request: { id } });
    return response;
  }

  async readCharacteristicForDevice(id, serviceUuid, characteristicUuid) {
    const response = this.expectCommand({ command: 'readCharacteristicForDevice', request: { id, serviceUuid, characteristicUuid } });
    return response;
  }

  async readRSSIForDevice(id) {
    return { rssi: -42 }; // TODO: use capture
  }
}
