import { PermissionsAndroid } from 'react-native';

const testList = [];

export const it = (name, fn) => {
  testList.push({ name, fn });
};

export const assert = {
  ok: (actual, message) => {
    if (!actual) {
      throw new Error(message);
    }
  },
  strictEqual: (actual, expected) => {
    if (actual !== expected) {
      throw new Error(`Expected ${actual} to equal ${expected}`);
    }
  },
};

export const run = async reporter => {
  reporter.onStart();
  // TODO: move somewhere else
  const permissionResult = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
  );
  if (permissionResult === PermissionsAndroid.RESULTS.GRANTED) {
    for (const { name, fn } of testList) {
      let error;
      const then = Date.now();
      try {
        const promiseOrVoid = await fn();
        await Promise.resolve(promiseOrVoid);
      } catch (err) {
        error = err;
      }
      const duration = Date.now() - then;
      if (error) {
        reporter.onFail({ duration, error, name });
      } else {
        reporter.onPass({ duration, name });
      }
    }
  }
  reporter.onComplete();
};
