// import { expect } from 'chai';

import { expect } from 'chai';
import { parseBleCaptureEvent, parseBleRecord } from './bleCaptureJsonProtocol.js';
import { BleRecorder } from './bleRecorder.js';

class BleManagerFake {
  destroy() { }
}

class Logger {
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
      const bleManager = new BleManagerFake();
      const captureName = 'minimal';
      const { bleLog, captureLog, logger } = new Logger();
      const bleRecorder = new BleRecorder({ bleManager, captureName, logger });
      bleRecorder.close();
      expect(captureLog).to.deep.equal([
        { event: 'init', name: 'minimal' },
        { event: 'save', name: 'minimal' },
      ]);
      expect(bleLog).to.deep.equal([]);
    });
  });
});
