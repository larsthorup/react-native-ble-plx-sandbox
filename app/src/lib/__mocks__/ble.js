
class BleManagerMock {
  constructor(messageList) {
    this.messageList = messageList;
    this.nextMessageIndex = 0;
  }

  popMessage(reason) {
    const message = this.messageList[this.nextMessageIndex];
    ++this.nextMessageIndex;
    // console.log(`popping: ${JSON.stringify(message)}`);
    return message;
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

  async expectCommand({ command, request }) {
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

  playNext() {
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

  playUntilCommand() {
    try {
      const fromMessageIndex = this.nextMessageIndex;
      while (true) {
        if (this.nextMessageIndex >= this.messageList.length) {
          throw new Error(`BleManagerMock: command not found in recording since index ${fromMessageIndex}`);
        }
        const message = this.messageList[this.nextMessageIndex];
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

  playUntil(label) {
    try {
      const fromMessageIndex = this.nextMessageIndex;
      while (true) {
        if (this.nextMessageIndex >= this.messageList.length) {
          throw new Error(`BleManagerMock: label "${label}" not found in recording since index ${fromMessageIndex}`);
        }
        const message = this.messageList[this.nextMessageIndex];
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

  expectFullCaptureCoverage() {
    const remainingMessageCount = this.messageList.length - this.nextMessageIndex;
    if (remainingMessageCount > 0) {
      throw new Error(`Expected recording to be fully covered but last ${remainingMessageCount} messages were not played`);
    }
  }
}

let bleManagerMock; // TODO: avoid global to support parallel jest tests

export const autoMockBleManager = (spec) => {
  const messageList = JSON.parse(JSON.stringify(spec)); // TODO: generate recording from spec
  bleManagerMock = new BleManagerMock(messageList);
  return bleManagerMock;
};

export const getBleManager = () => {
  if (!bleManagerMock) {
    const err = new Error('Cannot perform getBleManager before calling autoMockBleManager');
    console.error(err);
    throw err;
  }
  return bleManagerMock;
};
