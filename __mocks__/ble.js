class BleManagerMock {

  onStateChange(onStateChange) {
    // TODO: wait for bleMock to trigger this event
    onStateChange('PoweredOn');
  }

  startDeviceScan(uuidList, scanOptions, onDeviceScan) {
    // TODO: wait for bleMock to trigger this event
    onDeviceScan(null, { name: 'SomeDeviceName' });
    onDeviceScan(null, { name: 'SomeOtherName' });
  }

  stopDeviceScan() { }

  playUntil(label) {
    // TODO: trigger events
  }

}

const bleManagerMock = new BleManagerMock();

export default function getBleManager() {
  return bleManagerMock;
}
