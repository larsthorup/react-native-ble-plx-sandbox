
class BleManagerMock {
  constructor(messageList) {
    this.messageList = messageList;
    this.nextMessageIndex = 0;
  }

  onStateChange(onStateChange) {
    onStateChange('PoweredOn');
  }

  startDeviceScan(uuidList, scanOptions, onDeviceScan) {
    this.onDeviceScan = onDeviceScan;
  }

  stopDeviceScan() { }

  async connectToDevice(id) {
    this.expectNext({ command: 'connectToDevice', request: { id } });
  }

  async discoverAllServicesAndCharacteristicsForDevice(id) {
    this.expectNext({ command: 'discoverAllServicesAndCharacteristicsForDevice', request: { id } });
  }

  async readCharacteristicForDevice(id, serviceUuid, characteristicUuid) {
    const response = this.expectNext({ command: 'readCharacteristicForDevice', request: { id, serviceUuid, characteristicUuid } });
    return response;
  }

  async expectNext({ command, request }) {
    const message = this.messageList[this.nextMessageIndex];
    if (message.command !== command) {
      console.error(`BleManagerMock: expected command "${command}" but found ${JSON.stringify(message)}`);
    }
    // TODO: use proper deep equal function
    if (JSON.stringify(message.request) !== JSON.stringify(request)) {
      console.error(`BleManagerMock: expected command "${command}" to have request "${JSON.stringify(request)}" but found "${JSON.stringify(message)}"`);
    }
    const { response } = message;
    ++this.nextMessageIndex;
    // console.log(`BleManagerMock: ${command} returning ${JSON.stringify(response)}`);
    return response;
  }

  playNext() {
    const message = this.messageList[this.nextMessageIndex];
    const { event, label } = message;
    if (label) {
      console.log(`(BleManagerMock: unused label: "${label}")`);
    } else {
      switch (event) {
        case 'onDeviceScan':
          const { onDeviceScan } = this;
          if (onDeviceScan) {
            const error = null;
            const { device } = message;
            onDeviceScan(error, device);
          } else {
            console.warn(`BleManagerMock: message cannot be delivered, as bleManager.startDeviceScan has not yet been called: ${JSON.stringify(message)}`);
          }
          break;
        default:
          throw new Error(`BleManagerMock: Unrecognized event "${event}" in message ${JSON.stringify(message)}`);
      }
    }
    ++this.nextMessageIndex;
  }

  playUntil(label) {
    while (true) {
      if (this.nextMessageIndex > this.messageList.length) {
        throw new Error(`BleManagerMock: label "${label}" not found in recording`);
      }
      if (this.messageList[this.nextMessageIndex].label === label) {
        ++this.nextMessageIndex;
        break;
      }
      this.playNext();
    }
  }

}

let bleManagerMock;

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