import { expect } from 'chai';
import * as td from 'testdouble';
import { parseBleCaptureEvent, parseBleRecord } from './bleCaptureJsonProtocol.js';
import { BleRecorder, BleManagerSpy } from './bleRecorder.js';

const BleManagerFake = td.constructor(BleManagerSpy);

class LoggerSpy {
  constructor() {
    this.bleLog = [];
    this.captureLog = [];
    this.logger = (line) => {
      const bleRecord = parseBleRecord(line);
      const captureEvent = parseBleCaptureEvent(line);
      if (bleRecord) {
        this.bleLog.push(bleRecord);
      }
      if (captureEvent) {
        this.captureLog.push(captureEvent);
      }
    };
  }
}

describe('bleRecorder', () => {
  describe('minimal scenario', () => {
    it('should record an empty capture file', () => {
      const bleManagerFake = new BleManagerFake();
      const { bleLog, captureLog, logger } = new LoggerSpy();
      const bleRecorder = new BleRecorder({ bleManager: bleManagerFake, logger });
      bleRecorder.close();
      expect(captureLog).to.deep.equal([
        { event: 'init', name: 'default', version: '1.0.0' },
        { event: 'save', name: 'default' },
      ]);
      expect(bleLog).to.deep.equal([]);
    });
  });

  describe('captureName', () => {
    it('should name the capture file', () => {
      const bleManagerFake = new BleManagerFake();
      const captureName = 'some-capture-name';
      const { bleLog, captureLog, logger } = new LoggerSpy();
      const bleRecorder = new BleRecorder({ bleManager: bleManagerFake, captureName, logger });
      bleRecorder.close();
      expect(captureLog).to.deep.equal([
        { event: 'init', name: 'some-capture-name', version: '1.0.0' },
        { event: 'save', name: 'some-capture-name' },
      ]);
      expect(bleLog).to.deep.equal([]);
    });
  });

  describe('startDeviceScan', () => {
    const uuidList = ['some', 'uuids'];
    const scanOptions = { allowDuplicates: true };

    describe('minimal settings', () => {
      it('should record commands and events in capture file', () => {
        // given a few device scans
        const bleManagerFake = new BleManagerFake();
        td.when(bleManagerFake.startDeviceScan(uuidList, scanOptions, td.matchers.isA(Function))).thenDo((u, o, listener) => {
          listener(null, { id: 'some-device-id', name: 'some-device-name' });
          listener(null, { id: 'some-other-device-id', name: 'some-other-device-name' });
          listener(null, { id: 'some-device-id', name: 'some-device-name' });
        });

        const { bleLog, logger } = new LoggerSpy();
        const bleRecorder = new BleRecorder({ bleManager: bleManagerFake, logger });
        const bleManager = bleRecorder.bleManagerSpy;

        // when starting device scan
        bleManager.startDeviceScan(uuidList, scanOptions, () => { });
        bleRecorder.label('scanned');
        bleRecorder.close();

        // then all scans are recorded
        expect(bleLog).to.deep.equal([
          {
            type: 'command',
            command: 'startDeviceScan',
            request: {
              scanOptions: { allowDuplicates: true },
              uuidList: ['some', 'uuids'],
            },
          },
          {
            type: 'event',
            event: 'deviceScan',
            args: {
              device: { id: 'some-device-id', name: 'some-device-name' },
            },
          },
          {
            type: 'event',
            event: 'deviceScan',
            args: {
              device: { id: 'some-other-device-id', name: 'some-other-device-name' },
            },
          },
          {
            type: 'event',
            event: 'deviceScan',
            args: {
              device: { id: 'some-device-id', name: 'some-device-name' },
            },
          },
          {
            type: 'label',
            label: 'scanned',
          },
        ]);
      });
    });

    describe('deviceMap', () => {
      it('should filter and map device id and name in capture file', () => {
        // given a single device scan will happen
        const bleManagerFake = new BleManagerFake();
        td.when(bleManagerFake.startDeviceScan(uuidList, scanOptions, td.matchers.isA(Function))).thenDo((u, o, listener) => {
          listener(null, { id: 'some-device-id', name: 'some-device-name' });
          listener(null, { id: 'some-ignored-device-id', name: 'some-ignored-device-name' });
        });

        // given a map of expected devices and recorded device names and ids
        const deviceMap = {
          expected: {
            'some-device-id': {
              name: 'some-device-name',
              recordId: 'recorded-device-id',
            },
          },
          record: {
            'recorded-device-id': {
              name: 'recorded-device-name',
            },
          },
        };
        const { bleLog, logger } = new LoggerSpy();
        const bleRecorder = new BleRecorder({ bleManager: bleManagerFake, deviceMap, logger });
        const bleManager = bleRecorder.bleManagerSpy;

        bleManager.startDeviceScan(uuidList, scanOptions, () => { });
        bleRecorder.close();

        expect(bleLog).to.deep.equal([
          {
            type: 'command',
            command: 'startDeviceScan',
            request: {
              scanOptions: { allowDuplicates: true },
              uuidList: ['some', 'uuids'],
            },
          },
          {
            type: 'event',
            event: 'deviceScan',
            args: {
              device: { id: 'recorded-device-id', name: 'recorded-device-name' },
            },
          },
        ]);
      });
    });

    describe('spec', () => {
      it('should record commands and events in capture file', () => {
        // given a few device scans
        const bleManagerFake = new BleManagerFake();
        td.when(bleManagerFake.startDeviceScan(uuidList, scanOptions, td.matchers.isA(Function))).thenDo((u, o, listener) => {
          listener(null, { id: 'some-device-id', name: 'some-device-name' });
          listener(null, { id: 'some-device-id', name: 'some-device-name' });
        });

        const { bleLog, logger } = new LoggerSpy();
        const bleRecorder = new BleRecorder({ bleManager: bleManagerFake, logger });
        const bleManager = bleRecorder.bleManagerSpy;

        // given a number of deviceScan events to keep
        bleRecorder.spec.deviceScan = { keep: 1 };

        // when starting device scan
        bleManager.startDeviceScan(uuidList, scanOptions, () => { });
        bleRecorder.close();

        // then only the specified number of scans are recorded
        expect(bleLog).to.deep.equal([
          {
            type: 'command',
            command: 'startDeviceScan',
            request: {
              scanOptions: { allowDuplicates: true },
              uuidList: ['some', 'uuids'],
            },
          },
          {
            type: 'event',
            event: 'deviceScan',
            args: {
              device: { id: 'some-device-id', name: 'some-device-name' },
            },
            spec: {
              keep: 1,
            },
          },
        ]);
      });
    });

    describe('scan error', () => {
      it('should record scan error in capture file', () => {

        // given a device scan error
        const bleManagerFake = new BleManagerFake();
        td.when(bleManagerFake.startDeviceScan(uuidList, scanOptions, td.matchers.isA(Function))).thenDo((u, o, listener) => {
          listener({ message: 'some error message' });
        });

        const { bleLog, logger } = new LoggerSpy();
        const bleRecorder = new BleRecorder({ bleManager: bleManagerFake, logger });
        const bleManager = bleRecorder.bleManagerSpy;

        // when starting device scan
        bleManager.startDeviceScan(uuidList, scanOptions, () => { });
        bleRecorder.close();

        // then the scan error is recorded
        expect(bleLog).to.deep.equal([
          {
            type: 'command',
            command: 'startDeviceScan',
            request: {
              scanOptions: { allowDuplicates: true },
              uuidList: ['some', 'uuids'],
            },
          },
          {
            type: 'event',
            event: 'deviceScan',
            args: {
              error: { message: 'some error message' },
            },
          },
        ]);
      });
    });
  });

  describe('readCharacteristicForDevice', () => {
    describe('minimal scenario', () => {
      it('should record literal uuids and values', async () => {
        const bleManagerFake = new BleManagerFake();
        td.when(bleManagerFake.readCharacteristicForDevice('some-device-id', 'some-service-uuid', 'some-characteristic-uuid')).thenResolve({ value: 'Z2Rj' });
        const { bleLog, logger } = new LoggerSpy();
        const bleRecorder = new BleRecorder({ bleManager: bleManagerFake, logger });
        const bleManager = bleRecorder.bleManagerSpy;

        // when
        const characteristic = await bleManager.readCharacteristicForDevice('some-device-id', 'some-service-uuid', 'some-characteristic-uuid');
        expect(characteristic).to.deep.equal({ value: 'Z2Rj' });
        bleRecorder.close();

        // then command is recorded
        expect(bleLog).to.deep.equal([
          {
            type: 'command',
            command: 'readCharacteristicForDevice',
            request: {
              characteristicUUID: 'some-characteristic-uuid',
              id: 'some-device-id',
              serviceUUID: 'some-service-uuid',
            },
            response: {
              value: 'Z2Rj',
            },
            debug: {
              value: '<Buffer 67 64 63> \'gdc\'',
            },
          },
        ]);
      });
    });

    describe('queueRecordValue', () => {
      it('should record specified value', async () => {
        const bleManagerFake = new BleManagerFake();
        td.when(bleManagerFake.readCharacteristicForDevice('some-device-id', 'some-service-uuid', 'some-characteristic-uuid')).thenResolve({ value: 'Kg==' });
        const { bleLog, logger } = new LoggerSpy();
        const bleRecorder = new BleRecorder({ bleManager: bleManagerFake, logger });
        const bleManager = bleRecorder.bleManagerSpy;

        // when
        bleRecorder.queueRecordValue('AA==');
        const characteristic = await bleManager.readCharacteristicForDevice('some-device-id', 'some-service-uuid', 'some-characteristic-uuid');
        expect(characteristic).to.deep.equal({ value: 'Kg==' });
        bleRecorder.close();

        // then command is recorded
        expect(bleLog).to.deep.equal([
          {
            type: 'command',
            command: 'readCharacteristicForDevice',
            request: {
              characteristicUUID: 'some-characteristic-uuid',
              id: 'some-device-id',
              serviceUUID: 'some-service-uuid',
            },
            response: {
              value: 'AA==',
            },
            debug: {
              value: '<Buffer 00>',
            },
          },
        ]);
      });
    });

    describe('nameFromUuid', () => {
      it('should include names for uuids', async () => {
        const bleManagerFake = new BleManagerFake();
        td.when(bleManagerFake.readCharacteristicForDevice('some-device-id', 'some-service-uuid', 'some-characteristic-uuid')).thenResolve({ value: 'Kg==' });
        const { bleLog, logger } = new LoggerSpy();

        // given map of name per uuid
        const nameFromUuid = {
          'some-service-uuid': 'some-service-name',
          'some-characteristic-uuid': 'some-characteristic-name',
        };

        const bleRecorder = new BleRecorder({ bleManager: bleManagerFake, logger, nameFromUuid });
        const bleManager = bleRecorder.bleManagerSpy;

        // when
        bleRecorder.queueRecordValue('AA==');
        const characteristic = await bleManager.readCharacteristicForDevice('some-device-id', 'some-service-uuid', 'some-characteristic-uuid');
        expect(characteristic).to.deep.equal({ value: 'Kg==' });
        bleRecorder.close();

        // then command is recorded
        expect(bleLog).to.deep.equal([
          {
            type: 'command',
            command: 'readCharacteristicForDevice',
            request: {
              characteristicUUID: 'some-characteristic-uuid',
              id: 'some-device-id',
              serviceUUID: 'some-service-uuid',
            },
            response: {
              value: 'AA==',
            },
            debug: {
              characteristicUUID: 'some-characteristic-name',
              serviceUUID: 'some-service-name',
              value: '<Buffer 00>',
            },
          },
        ]);
      });
    });
  });

  describe('state', () => {
    it('should record command with request and response', async () => {
      const bleManagerFake = new BleManagerFake();
      const { bleLog, logger } = new LoggerSpy();
      const bleRecorder = new BleRecorder({ bleManager: bleManagerFake, logger });
      td.when(bleManagerFake.state()).thenResolve('some-state');
      const bleManager = bleRecorder.bleManagerSpy;
      const state = await bleManager.state();
      expect(state).to.equal('some-state');
      bleRecorder.close();
      expect(bleLog).to.deep.equal([
        {
          type: 'command',
          command: 'state',
          request: {},
          response: 'some-state',
        },
      ]);
    });
  });
  describe('onStateChange', () => {
    it('should record commands and events in capture file', () => {
      // given a few device scans
      const bleManagerFake = new BleManagerFake();
      td.when(bleManagerFake.onStateChange(td.matchers.isA(Function), true)).thenDo((listener) => {
        listener('some-state');
      });

      const { bleLog, logger } = new LoggerSpy();
      const bleRecorder = new BleRecorder({ bleManager: bleManagerFake, logger });
      const bleManager = bleRecorder.bleManagerSpy;

      // when starting device scan
      bleManager.onStateChange(() => { }, true);
      bleRecorder.close();

      // then all scans are recorded
      expect(bleLog).to.deep.equal([
        {
          type: 'command',
          command: 'onStateChange',
          request: {
            emitCurrentState: true,
          },
        },
        {
          type: 'event',
          event: 'stateChange',
          args: {
            powerState: 'some-state',
          },
        },
      ]);
    });
  });
  describe('stopDeviceScan', () => {
    it('should record command', async () => {
      const bleManagerFake = new BleManagerFake();
      const { bleLog, logger } = new LoggerSpy();
      const bleRecorder = new BleRecorder({ bleManager: bleManagerFake, logger });
      td.when(bleManagerFake.stopDeviceScan()).thenResolve();
      const bleManager = bleRecorder.bleManagerSpy;
      await bleManager.stopDeviceScan();
      bleRecorder.close();
      expect(bleLog).to.deep.equal([
        {
          type: 'command',
          command: 'stopDeviceScan',
        },
      ]);
    });
  });
  describe('isDeviceConnected', () => {
    it('should record command with request and response', async () => {
      const bleManagerFake = new BleManagerFake();
      const { bleLog, logger } = new LoggerSpy();
      const bleRecorder = new BleRecorder({ bleManager: bleManagerFake, logger });
      td.when(bleManagerFake.isDeviceConnected('some-device-id')).thenResolve(true);
      const bleManager = bleRecorder.bleManagerSpy;
      const isConnected = await bleManager.isDeviceConnected('some-device-id');
      expect(isConnected).to.be.true;
      bleRecorder.close();
      expect(bleLog).to.deep.equal([
        {
          type: 'command',
          command: 'isDeviceConnected',
          request: {
            id: 'some-device-id',
          },
          response: true,
        },
      ]);
    });
  });
  describe('readRSSIForDevice', () => {
    it('should record command with request and response', async () => {
      const bleManagerFake = new BleManagerFake();
      const { bleLog, logger } = new LoggerSpy();
      const bleRecorder = new BleRecorder({ bleManager: bleManagerFake, logger });
      td.when(bleManagerFake.readRSSIForDevice('some-device-id')).thenResolve({ rssi: -42 });
      const bleManager = bleRecorder.bleManagerSpy;
      const { rssi } = await bleManager.readRSSIForDevice('some-device-id');
      expect(rssi).to.equal(-42);
      bleRecorder.close();
      expect(bleLog).to.deep.equal([
        {
          type: 'command',
          command: 'readRSSIForDevice',
          request: {
            id: 'some-device-id',
          },
          response: {
            id: 'some-device-id',
            rssi: -42,
          },
        },
      ]);
    });
  });
  describe('connectToDevice', () => {
    it('should record command with request and response', async () => {
      const bleManagerFake = new BleManagerFake();
      const { bleLog, logger } = new LoggerSpy();
      const bleRecorder = new BleRecorder({ bleManager: bleManagerFake, logger });
      td.when(bleManagerFake.connectToDevice('some-device-id', { autoConnect: false })).thenResolve({
        id: 'some-device-id',
      });
      const bleManager = bleRecorder.bleManagerSpy;
      const device = await bleManager.connectToDevice('some-device-id', { autoConnect: false });
      expect(device.id).to.equal('some-device-id');
      bleRecorder.close();
      expect(bleLog).to.deep.equal([
        {
          type: 'command',
          command: 'connectToDevice',
          request: {
            id: 'some-device-id',
            options: {
              autoConnect: false,
            },
          },
          response: {
            id: 'some-device-id',
          },
        },
      ]);
    });
  });
  describe('connectedDevices', () => {
    it('should record command with request and response', async () => {
      const bleManagerFake = new BleManagerFake();
      const { bleLog, logger } = new LoggerSpy();
      const bleRecorder = new BleRecorder({ bleManager: bleManagerFake, logger });
      td.when(bleManagerFake.connectedDevices(['some-uuid'])).thenResolve([{ id: 'some-device-id' }]);
      const bleManager = bleRecorder.bleManagerSpy;
      const deviceList = await bleManager.connectedDevices(['some-uuid']);
      expect(deviceList).to.deep.equal([{ id: 'some-device-id' }]);
      bleRecorder.close();
      expect(bleLog).to.deep.equal([
        {
          type: 'command',
          command: 'connectedDevices',
          request: {
            serviceUUIDs: ['some-uuid'],
          },
          response: [
            { id: 'some-device-id' },
          ],
        },
      ]);
    });
  });
  describe('onDeviceDisconnected', () => {
    it('should record commands and events in capture file', () => {
      // given a few device scans
      const bleManagerFake = new BleManagerFake();
      td.when(bleManagerFake.onDeviceDisconnected('some-device-id', td.matchers.isA(Function))).thenDo((_, listener) => {
        listener(null, { id: 'some-device-id' });
      });

      const { bleLog, logger } = new LoggerSpy();
      const bleRecorder = new BleRecorder({ bleManager: bleManagerFake, logger });
      const bleManager = bleRecorder.bleManagerSpy;

      // when starting device scan
      bleManager.onDeviceDisconnected('some-device-id', () => { });
      bleRecorder.close();

      // then all scans are recorded
      expect(bleLog).to.deep.equal([
        {
          type: 'command',
          command: 'onDeviceDisconnected',
          request: {
            id: 'some-device-id',
          },
        },
        {
          type: 'event',
          event: 'deviceDisconnected',
          args: {
            device: { id: 'some-device-id' },
          },
        },
      ]);
    });
  });
  describe('requestMTUForDevice', () => {
    it('should record command with request and response', async () => {
      const bleManagerFake = new BleManagerFake();
      const { bleLog, logger } = new LoggerSpy();
      const bleRecorder = new BleRecorder({ bleManager: bleManagerFake, logger });
      td.when(bleManagerFake.requestMTUForDevice('some-device-id', 96)).thenResolve({ id: 'some-device-id', mtu: 96 });
      const bleManager = bleRecorder.bleManagerSpy;
      const { mtu } = await bleManager.requestMTUForDevice('some-device-id', 96);
      expect(mtu).to.equal(96);
      bleRecorder.close();
      expect(bleLog).to.deep.equal([
        {
          type: 'command',
          command: 'requestMTUForDevice',
          request: {
            id: 'some-device-id',
            mtu: 96,
          },
          response: {
            id: 'some-device-id',
            mtu: 96,
          },
        },
      ]);
    });
  });
  describe('discoverAllServicesAndCharacteristicsForDevice', () => {
    it('should record command with request and response', async () => {
      const bleManagerFake = new BleManagerFake();
      const { bleLog, logger } = new LoggerSpy();
      const bleRecorder = new BleRecorder({ bleManager: bleManagerFake, logger });
      td.when(bleManagerFake.discoverAllServicesAndCharacteristicsForDevice('some-device-id')).thenResolve();
      const bleManager = bleRecorder.bleManagerSpy;
      await bleManager.discoverAllServicesAndCharacteristicsForDevice('some-device-id');
      bleRecorder.close();
      expect(bleLog).to.deep.equal([
        {
          type: 'command',
          command: 'discoverAllServicesAndCharacteristicsForDevice',
          request: {
            id: 'some-device-id',
          },
        },
      ]);
    });
  });
  describe('devices', () => {
    it('should record command with request and response', async () => {
      const bleManagerFake = new BleManagerFake();
      const { bleLog, logger } = new LoggerSpy();
      const bleRecorder = new BleRecorder({ bleManager: bleManagerFake, logger });
      td.when(bleManagerFake.devices(['some-device-id'])).thenResolve([{ id: 'some-device-id' }]);
      const bleManager = bleRecorder.bleManagerSpy;
      const deviceList = await bleManager.devices(['some-device-id']);
      expect(deviceList).to.deep.equal([{ id: 'some-device-id' }]);
      bleRecorder.close();
      expect(bleLog).to.deep.equal([
        {
          type: 'command',
          command: 'devices',
          request: {
            deviceIdentifiers: ['some-device-id'],
          },
          response: [
            { id: 'some-device-id' },
          ],
        },
      ]);
    });
  });
  describe('servicesForDevice', () => {
    it('should record command with request and response', async () => {
      const bleManagerFake = new BleManagerFake();
      const { bleLog, logger } = new LoggerSpy();
      const bleRecorder = new BleRecorder({ bleManager: bleManagerFake, logger });
      td.when(bleManagerFake.servicesForDevice('some-device-id')).thenResolve([{ uuid: 'some-service-uuid' }]);
      const bleManager = bleRecorder.bleManagerSpy;
      const serviceList = await bleManager.servicesForDevice('some-device-id');
      expect(serviceList).to.deep.equal([{ uuid: 'some-service-uuid' }]);
      bleRecorder.close();
      expect(bleLog).to.deep.equal([
        {
          type: 'command',
          command: 'servicesForDevice',
          request: {
            id: 'some-device-id',
          },
          response: [
            { uuid: 'some-service-uuid' },
          ],
        },
      ]);
    });
  });
  describe('characteristicsForDevice', () => {
    it('should record command with request and response', async () => {
      const bleManagerFake = new BleManagerFake();
      const { bleLog, logger } = new LoggerSpy();
      const bleRecorder = new BleRecorder({ bleManager: bleManagerFake, logger });
      td.when(bleManagerFake.characteristicsForDevice('some-device-id', 'some-service-uuid')).thenResolve([{ uuid: 'some-characteristic-uuid' }]);
      const bleManager = bleRecorder.bleManagerSpy;
      const characteristicList = await bleManager.characteristicsForDevice('some-device-id', 'some-service-uuid');
      expect(characteristicList).to.deep.equal([{ uuid: 'some-characteristic-uuid' }]);
      bleRecorder.close();
      expect(bleLog).to.deep.equal([
        {
          type: 'command',
          command: 'characteristicsForDevice',
          request: {
            id: 'some-device-id',
            serviceUUID: 'some-service-uuid',
          },
          response: [
            { uuid: 'some-characteristic-uuid' },
          ],
        },
      ]);
    });
  });
  describe('monitorCharacteristicForDevice', () => {
    it('should record commands and events in capture file', () => {
      // given a few device scans
      const bleManagerFake = new BleManagerFake();
      td.when(bleManagerFake.monitorCharacteristicForDevice('some-device-id', 'some-service-uuid', 'some-characteristic-uuid', td.matchers.isA(Function))).thenDo((d, s, c, listener) => {
        listener(null, { uuid: 'some-characteristic-uuid', value: 'Kg==' });
      });

      const { bleLog, logger } = new LoggerSpy();
      const bleRecorder = new BleRecorder({ bleManager: bleManagerFake, logger });
      const bleManager = bleRecorder.bleManagerSpy;

      // when starting device scan
      bleManager.monitorCharacteristicForDevice('some-device-id', 'some-service-uuid', 'some-characteristic-uuid', () => { });
      bleRecorder.close();

      // then all scans are recorded
      expect(bleLog).to.deep.equal([
        {
          type: 'command',
          command: 'monitorCharacteristicForDevice',
          request: {
            id: 'some-device-id',
            serviceUUID: 'some-service-uuid',
            characteristicUUID: 'some-characteristic-uuid',
          },
        },
        {
          type: 'event',
          event: 'characteristic',
          args: {
            characteristic: {
              serviceUUID: 'some-service-uuid',
              uuid: 'some-characteristic-uuid',
              value: 'Kg==',
            },
          },
          autoPlay: true,
          debug: {
            value: '<Buffer 2a> \'*\'',
          },
        },
      ]);
    });
  });
  describe('writeCharacteristicWithResponseForDevice', () => {
    it('should record literal uuids and values', async () => {
      const bleManagerFake = new BleManagerFake();
      td.when(bleManagerFake.writeCharacteristicWithResponseForDevice('some-device-id', 'some-service-uuid', 'some-characteristic-uuid', 'Z2Rj')).thenResolve();
      const { bleLog, logger } = new LoggerSpy();
      const bleRecorder = new BleRecorder({ bleManager: bleManagerFake, logger });
      const bleManager = bleRecorder.bleManagerSpy;

      // when
      await bleManager.writeCharacteristicWithResponseForDevice('some-device-id', 'some-service-uuid', 'some-characteristic-uuid', 'Z2Rj');
      bleRecorder.close();

      // then command is recorded
      expect(bleLog).to.deep.equal([
        {
          type: 'command',
          command: 'writeCharacteristicWithResponseForDevice',
          request: {
            characteristicUUID: 'some-characteristic-uuid',
            id: 'some-device-id',
            serviceUUID: 'some-service-uuid',
            value: 'Z2Rj',
          },
          debug: {
            value: '<Buffer 67 64 63> \'gdc\'',
          },
        },
      ]);
    });
  });
});
