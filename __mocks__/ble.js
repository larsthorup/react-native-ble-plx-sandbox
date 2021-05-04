
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

  playNext() {
    const message = this.messageList[this.nextMessageIndex];
    const { event } = message;
    switch (event) {
      case 'onDeviceScan':
        const { onDeviceScan } = this;
        if (onDeviceScan) {
          const error = null;
          const { device } = message;
          onDeviceScan(error, device);
        } else {
          console.warn(`Message cannot be delivered, as bleManager.startDeviceScan has not yet been called: ${JSON.stringify(message)}`);
        }
        break;
      default:
        throw new Error(`Unrecognized BLE event in mocked traffic: "${event}"`);
    }
    ++this.nextMessageIndex;
  }

  playUntil(label) {
    while (this.nextMessageIndex <= this.messageList.length && this.messageList[this.nextMessageIndex].label !== label) {
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
