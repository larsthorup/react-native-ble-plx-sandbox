import * as path from 'path';
import mocha, { run } from '../mocha.js';
import { stringifyTestRunnerEvent } from '../testRunnerJsonProtocol.js';

// Note: inspired by https://github.com/mochajs/mocha/issues/3006#issuecomment-330738327
const testPath = path.resolve('./src/lib/test/testLauncher.test.simulated.js');
mocha.suite.emit('pre-require', global, testPath, mocha);
import * as fileExport from './testLauncher.test.simulated.js'; // fileExport is used by the exports interface, not sure if anything else; most interfaces act as a side effect of running the file
mocha.suite.emit('require', fileExport, testPath, mocha);
mocha.suite.emit('post-require', global, testPath, mocha);

const logger = (runnerEvent) => {
  console.log(stringifyTestRunnerEvent(runnerEvent));
};
await run(logger);
