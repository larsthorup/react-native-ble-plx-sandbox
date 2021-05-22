import { TestRunnerEventReporter } from './TestRunnerEventReporter';

class Suite {
  constructor(name) {
    this.name = name;
    this.testList = [];
    this.beforeList = [];
    this.afterList = [];
  }
}

const suiteList = [];
const globalSuite = new Suite('(global)');
let currentSuite = globalSuite;

export const describe = (name, fn) => {
  if (currentSuite !== globalSuite) { throw new Error('testRunner: nested "describe" not supported yet'); }
  const suite = new Suite(name);
  suiteList.push(suite);
  currentSuite = suite;
  fn();
  currentSuite = globalSuite;
};

export const it = (name, fn) => {
  currentSuite.testList.push({ fn, name });
};

export const before = (fn) => {
  currentSuite.beforeList.push({ fn, name: 'before' });
};

export const after = (fn) => {
  currentSuite.afterList.push({ fn, name: 'after' });
};

export const run = async (logger) => {
  const reporter = new TestRunnerEventReporter(logger);
  reporter.onStart();
  const suites = [];
  await runTestList({ reporter, suites, testList: globalSuite.beforeList });
  for (const suite of suiteList) {
    const { name } = suite;
    const then = Date.now();
    reporter.onSuiteStart({ name });
    await runSuite({ reporter, suite });
    const duration = Date.now() - then;
    reporter.onSuiteComplete({ duration, name });
  }
  await runTestList({ reporter, suites, testList: globalSuite.afterList });
  reporter.onComplete();
};

const runSuite = async ({ reporter, suite }) => {
  const suites = [suite.name];
  await runTestList({ reporter, suites, testList: suite.beforeList });
  await runTestList({ reporter, suites, testList: suite.testList });
  await runTestList({ reporter, suites, testList: suite.afterList });
};

const runTestList = async ({ reporter, suites, testList }) => {
  for (const { name, fn } of testList) {
    await runTest({ fn, name, reporter, suites });
  }
};

const runTest = async ({ fn, name, reporter, suites }) => {
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
};
