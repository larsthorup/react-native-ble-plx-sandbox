export class BleManagerCapture {
  constructor(bm) {
    this.bleManager = bm;
  }
  record(item) {
    console.log(`BleCapture: ${JSON.stringify(item)}`);
  }
  exclude(item) {
    console.log(`(excluding ${JSON.stringify(item)})`);
  }
  label(label) {
    this.record({ type: 'label', label });
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
        const { id, name } = this.recordDevice;
        this.record({
          type: 'event',
          event: 'deviceScan',
          args: {
            device: { id, name },
          },
        });
        listener(error, device);
      } else {
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
  async connectToDevice(deviceId) {
    await this.bleManager.connectToDevice(deviceId);
    const { id } = this.recordDevice; // TODO: replace volatile data before capture
    this.record({
      type: 'command',
      command: 'connectToDevice',
      request: { id },
    });
  }
  async discoverAllServicesAndCharacteristicsForDevice(deviceId) {
    await this.bleManager.discoverAllServicesAndCharacteristicsForDevice(deviceId);
    const { id } = this.recordDevice; // TODO: replace volatile data before capture
    this.record({
      type: 'command',
      command: 'discoverAllServicesAndCharacteristicsForDevice',
      request: { id },
    });
  }
  async servicesForDevice(deviceId) {
    const services = await this.bleManager.servicesForDevice(deviceId);
    const { id } = this.recordDevice; // TODO: replace volatile data before capture
    this.record({
      type: 'command',
      command: 'servicesForDevice',
      request: { id },
      response: services.map((service) => ({ uuid: service.uuid })),
    });
    return services;
  }
  async readCharacteristicForDevice(deviceId, serviceUuid, characteristicUuid) {
    const response = await this.bleManager.readCharacteristicForDevice(
      deviceId,
      serviceUuid,
      characteristicUuid,
    );
    // const { value } = response;
    const { id } = this.recordDevice; // TODO: replace volatile data before capture
    const value = this.recordValue; // TODO: replace volatile data before capture
    this.record({
      type: 'command',
      command: 'readCharacteristicForDevice',
      request: {
        id,
        serviceUuid,
        characteristicUuid,
      },
      response: {
        value,
      },
    });
    return response;
  }
}
