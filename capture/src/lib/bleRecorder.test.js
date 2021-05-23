// import { expect } from 'chai';

import { expect } from 'chai';
import * as td from 'testdouble';
import { parseBleCaptureEvent, parseBleRecord } from './bleCaptureJsonProtocol.js';
import { BleRecorder } from './bleRecorder.js';

const BleManagerFake = td.constructor(['destroy', 'startDeviceScan']);

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
        { event: 'init', name: 'default' },
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
        { event: 'init', name: 'some-capture-name' },
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
        ]);
      });
    });

    describe('deviceMap', () => {
      it('should filter and map device id and name in capture file', () => {
        // given a single device scan will happen
        const bleManagerFake = new BleManagerFake();
        td.when(bleManagerFake.startDeviceScan(uuidList, scanOptions, td.matchers.isA(Function))).thenDo((u, o, listener) => {
          listener(null, { id: 'some-device-id', name: 'some-device-name' });
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
      // bleRecorder.spec.deviceScan = { keep: 1 }; // TODO: default to keep all
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
  });
});
