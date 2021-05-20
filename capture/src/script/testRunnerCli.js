import * as cp from 'child_process';
import * as fs from 'fs';
import readline from 'readline';
import { promisify } from 'util';

import chalk from 'chalk';
import 'dotenv/config';
import { parseTestRunnerEvent } from '../lib/testRunnerJsonProtocol.js';
import { parseBleCaptureEvent, parseBleRecord } from '../lib/bleCaptureJsonProtocol.js';

const exec = promisify(cp.exec);
const { spawn } = cp;

const lineTransformer = (input) => readline.createInterface({ input });

const { name: appName } = JSON.parse(fs.readFileSync('./app.json'));

// clear adb log
await exec('adb logcat -c');

// start adb logcat
const logcat = spawn('adb', ['logcat', '-v', 'raw', '-s', 'ReactNativeJS:V']);
const logCatIgnorePrefixList = [
  '--------- beginning of ',
  `Running "${appName}" with `,
];

// stop app, if already running
try {
  await exec(`adb shell pm clear ${process.env.PACKAGE_NAME}`);
} catch (error) {
  console.log('(failed to clear app, continuing)');
}

// launch
console.log('Launching test runner on device...');
await exec(`adb shell am start -n '${process.env.PACKAGE_NAME}/.MainActivity'`);

let bleRecording = [];
// wait for event: complete
await new Promise((resolve) => {
  lineTransformer(logcat.stdout).on('line', (line) => {
    const runnerEvent = parseTestRunnerEvent(line);
    const bleRecord = parseBleRecord(line);
    const bleCaptureEvent = parseBleCaptureEvent(line);
    if (runnerEvent) {
      const { duration, event, message, name } = runnerEvent;
      switch (event) {
        case 'complete':
          console.log('Done!');
          resolve();
          break;
        case 'fail':
          console.log(`  ${chalk.red('X')} ${name}: ${message} (${duration} ms)`);
          break;
        case 'pass':
          console.log(`  ${chalk.green('√')} ${name} (${duration} ms)`);
          break;
        case 'start':
          console.log('Running tests...');
          break;
        case 'suite:complete':
          console.log(`  (${duration} ms)`);
          break;
        case 'suite:start':
          console.log(`> ${name}`);
          break;
      }
    } else if (bleRecord) {
      bleRecording.push(bleRecord);
    } else if (bleCaptureEvent) {
      const { event, name } = bleCaptureEvent;
      switch (event) {
        case 'init':
          bleRecording = [];
          break;
        case 'save':
          const capturePath = `artifact/${name}.capture.json`;
          fs.writeFileSync(capturePath, JSON.stringify(bleRecording, null, 2));
          console.log(`(BLE capture file saved in ${capturePath}: ${bleRecording.length} records)`);
          break;
      }
    } else if (logCatIgnorePrefixList.some((prefix) => line.startsWith(prefix))) {
      // skip
    } else {
      console.log(`    ${chalk.grey(line)}`);
    }
  });
});

// stop adb logcat
logcat.kill();