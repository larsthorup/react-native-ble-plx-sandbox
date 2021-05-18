// Note: eventually use an off-the-shelf assertion library
// such as Node.js "assert" module or "chai"

export const ok = (actual, message) => {
  if (!actual) {
    throw new Error(message);
  }
};

export const strictEqual = (actual, expected) => {
  if (actual !== expected) {
    throw new Error(`Expected ${actual} to equal ${expected}`);
  }
};
