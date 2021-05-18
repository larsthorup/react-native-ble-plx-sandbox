// Note: eventually use a standardized protocol, such as the mocha serialized reporter protocol
export class TestRunnerEventReporter {
  constructor(logger) {
    this.log = logger;
  }
  onComplete() {
    this.log({ event: 'complete' });
  }
  onFail({ duration, error, name, suites }) {
    this.log({ duration, event: 'fail', name, message: error.message, suites });
  }
  onPass({ duration, name }) {
    this.log({ duration, event: 'pass', name });
  }
  onStart() {
    this.log({ event: 'start' });
  }
  onSuiteComplete({ duration, name }) {
    this.log({ duration, event: 'suite:complete', name });
  }
  onSuiteStart({ name }) {
    this.log({ event: 'suite:start', name });
  }
}
