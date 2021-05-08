
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

  startDeviceScan(uuidList, scanOptions, onDeviceScan) {
    // TODO: error if listener alreay exists
    this.expectCommand({ command: 'startDeviceScan', request: { uuidList, scanOptions } });
    this.onDeviceScan = onDeviceScan;
  }

  stopDeviceScan() { }

  async connectToDevice(id) {
    this.expectCommand({ command: 'connectToDevice', request: { id } });
  }

  async discoverAllServicesAndCharacteristicsForDevice(id) {
    this.expectCommand({ command: 'discoverAllServicesAndCharacteristicsForDevice', request: { id } });
  }

  async readCharacteristicForDevice(id, serviceUuid, characteristicUuid) {
    const response = this.expectCommand({ command: 'readCharacteristicForDevice', request: { id, serviceUuid, characteristicUuid } });
    return response;
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
      console.error(`BleManagerMock: expected command "${command}" to have request "${JSON.stringify(request)}" but found "${JSON.stringify(message)}"`);
    }
    // console.log(`BleManagerMock: ${command} returning ${JSON.stringify(response)}`);
    return response;
  }

  playNext() {
    const message = this.popMessage();
    const { command, event, label } = message;
    if (label) {
      console.log(`(BleManagerMock: unused label: "${label}")`);
    } else if (event) { // TODO: type === 'event'
      switch (event) { // TODO: name
        case 'onDeviceScan': // TODO: 'deviceScan'
          const { onDeviceScan } = this; // TODO: deviceScanListener
          if (onDeviceScan) {
            const error = null;
            const { device } = message;
            onDeviceScan(error, device);
          } else {
            console.warn(`BleManagerMock: message cannot be delivered, as bleManager.startDeviceScan has not yet been called: ${JSON.stringify(message)}`);
          }
          break;
        case 'onStateChange':
          const { stateChangeListener } = this;
          if (stateChangeListener) {
            const { powerState } = message;
            stateChangeListener(powerState);
          } else {
            console.warn(`BleManagerMock: message cannot be delivered, as bleManager.onStateChange has not yet been called: ${JSON.stringify(message)}`);
          }
          break;
        default:
          throw new Error(`BleManagerMock: Unrecognized event "${event}" in message ${JSON.stringify(message)}`);
      }
    } else if (command) { // TODO: type === 'command'
      throw new Error(`BleManagerMock: command "${command}" expected but has not yet been called: ${JSON.stringify(message)}`);
    }
  }

  playUntilCommand() {
    try {
      const fromMessageIndex = this.nextMessageIndex;
      while (true) {
        if (this.nextMessageIndex >= this.messageList.length) {
          throw new Error(`BleManagerMock: command not found in recording since index ${fromMessageIndex}`);
        }
        if (this.messageList[this.nextMessageIndex].command) {
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
        if (this.messageList[this.nextMessageIndex].label === label) {
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

}

let bleManagerMock; // TODO: avoid global to support parallel jest tests

export const autoMockBleManager = (messageList) => {
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
