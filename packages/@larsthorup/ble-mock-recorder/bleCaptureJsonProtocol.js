const bleRecordPrefix = 'BleRecord: ';
const bleCapturePrefix = 'BleCapture: ';

export const parseBleCaptureEvent = (line) => {
  if (line.startsWith(bleCapturePrefix)) {
    const bleCaptureEvent = JSON.parse(line.substr(bleCapturePrefix.length));
    return bleCaptureEvent;
  } else {
    return undefined;
  }
};

export const parseBleRecord = (line) => {
  if (line.startsWith(bleRecordPrefix)) {
    const bleRecord = JSON.parse(line.substr(bleRecordPrefix.length));
    return bleRecord;
  } else {
    return undefined;
  }
};

export const stringifyBleCaptureEvent = (captureEvent) => {
  return `${bleCapturePrefix}${JSON.stringify(captureEvent)}`;
};

export const stringifyBleRecord = (record) => {
  return `${bleRecordPrefix}${JSON.stringify(record)}`;
};
