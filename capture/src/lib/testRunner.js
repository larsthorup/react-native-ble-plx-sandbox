import { PermissionsAndroid } from 'react-native';

const suiteList = [];
let currentSuite;

export const describe = (name, fn) => {
  if (currentSuite) { throw new Error('testRunner: nested "describe" not supported yet'); }
  const suite = {
    name,
    testList: [],
  };
  suiteList.push(suite);
  currentSuite = suite;
  fn();
  currentSuite = null;
};

export const it = (name, fn) => {
  currentSuite.testList.push({ name, fn });
};

export const before = (fn) => {
  // TODO: actually run before
  it('before', fn); // TODO: better name if multiple before
};

export const after = (fn) => {
  // TODO: actually run after
  it('after', fn); // TODO: better name if multiple after
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
  console.log('On phone: please allow location permission');
  const permissionResult = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
  );
  if (permissionResult === PermissionsAndroid.RESULTS.GRANTED) {
    for (const suite of suiteList) {
      const { name } = suite;
      const then = Date.now();
      reporter.onSuiteStart({ name });
      await runSuite({ reporter, suite });
      const duration = Date.now() - then;
      reporter.onSuiteComplete({ duration, name });
    }
  }
  reporter.onComplete();
};

const runSuite = async ({ reporter, suite }) => {
  const { testList } = suite;
  const suites = [suite.name];
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
      reporter.onFail({ duration, error, name, suites });
    } else {
      reporter.onPass({ duration, name, suites });
    }
  }
};
