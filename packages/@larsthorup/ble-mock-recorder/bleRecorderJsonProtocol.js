const bleRecordPrefix = 'BleRecord: ';
const bleRecorderPrefix = 'BleRecorder: ';

export const parseBleRecorderEvent = (line) => {
  if (line.startsWith(bleRecorderPrefix)) {
    const bleRecorderEvent = JSON.parse(line.substr(bleRecorderPrefix.length));
    return bleRecorderEvent;
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

export const stringifyBleRecorderEvent = (recorderEvent) => {
  return `${bleRecorderPrefix}${JSON.stringify(recorderEvent)}`;
};

export const stringifyBleRecord = (record) => {
  return `${bleRecordPrefix}${JSON.stringify(record)}`;
};
