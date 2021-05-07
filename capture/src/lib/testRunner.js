const testList = [];

export const it = (name, fn) => {
  testList.push({name, fn});
};

export const assert = {
  strictEqual: (actual, expected) => {
    if (actual !== expected) {
      throw new Error(`Expected ${actual} to equal ${expected}`);
    }
  },
};

export const run = async reporter => {
  reporter.onStart();
  for (const {name, fn} of testList) {
    try {
      await fn();
      reporter.onPass(name);
    } catch (ex) {
      reporter.onFail(name, ex);
    }
  }
  reporter.onComplete();
};
