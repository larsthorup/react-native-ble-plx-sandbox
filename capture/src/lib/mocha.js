/* global mocha */
import '../../node_modules/mocha/mocha.js';

global.location = {};
mocha.setup('bdd');
mocha.timeout(10000); // TODO: configure

export const run = async (logger) => {
  mocha.reporter(MochaEventReporter, { logger });
  return new Promise((resolve) => {
    mocha.run(resolve);
  });
};

function MochaEventReporter(runner, { reporterOptions }) {
  this.log = reporterOptions.logger;
  const {
    EVENT_RUN_BEGIN,
    EVENT_RUN_END,
    EVENT_SUITE_BEGIN,
    EVENT_SUITE_END,
    EVENT_TEST_BEGIN,
    EVENT_TEST_END,
    EVENT_TEST_FAIL,
    EVENT_TEST_PASS,
    EVENT_TEST_PENDING,
  } = runner.constructor.constants;
  runner
    .once(EVENT_RUN_BEGIN, () => {
      this.log({ event: 'start' });
    })
    .once(EVENT_RUN_END, () => {
      this.log({ event: 'complete' });
    })
    .on(EVENT_SUITE_BEGIN, (suite) => {
      const { title: name } = suite;
      this.log({ event: 'suite:start', name });
    })
    .on(EVENT_SUITE_END, (suite) => {
      const { name } = suite;
      this.log({ event: 'suite:complete', name });
    })
    .on(EVENT_TEST_BEGIN, (test) => {
      // TODO: this.send(EVENT_TEST_BEGIN, [test]);
    })
    .on(EVENT_TEST_END, (test) => {
      // TODO: this.send(EVENT_TEST_END, [test]);
    })
    .on(EVENT_TEST_FAIL, (test, error) => {
      const { duration, title: name } = test;
      const suites = []; // TODO
      this.log({ duration, event: 'fail', name, message: error.message, suites });
    })
    .on(EVENT_TEST_PASS, (test) => {
      const { duration, title: name } = test;
      this.log({ duration, event: 'pass', name });
    })
    .on(EVENT_TEST_PENDING, (test) => {
      // TODO: this.send(EVENT_TEST_PENDING, [test]);
    })
    ;
}
