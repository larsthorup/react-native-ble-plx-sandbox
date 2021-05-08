import * as cp from 'child_process';
import * as fs from 'fs';
import readline from 'readline';
import { promisify } from 'util';

import chalk from 'chalk';

const exec = promisify(cp.exec);
const { spawn } = cp;

const lineTransformer = (input) => readline.createInterface({ input });

// clear adb log
await exec('adb logcat -c');

// start adb logcat
const logcat = spawn('adb', ['logcat', '-v', 'raw', '-s', 'ReactNativeJS:V']);

// stop app, if already running
await exec('adb shell pm clear com.xpqf.rnblesandboxcapture');

// launch 
console.log('Launching test runner on device...');
await exec(`adb shell am start -n 'com.xpqf.rnblesandboxcapture/.MainActivity'`);

// wait for event: complete
const testRunnerPrefix = 'TestRunner: ';
const bleCapturePrefix = 'BleCapture: ';
const bleMessageList = [];
await new Promise((resolve) => {
  lineTransformer(logcat.stdout).on('line', (line) => {
    if (line.startsWith(testRunnerPrefix)) {
      const runnerEvent = JSON.parse(line.substr(testRunnerPrefix.length));
      const { duration, event, message, name } = runnerEvent;
      switch (event) {
        case 'complete':
          console.log('Done!');
          resolve();
          break;
        case 'fail':
          console.log(`${chalk.red('X')} ${name}: ${message} (${duration} ms)`);
          break;
        case 'pass':
          console.log(`${chalk.green('√')} ${name} (${duration} ms)`);
          break;
        case 'start':
          console.log('Running tests...');
          break;
      }
    } else if (line.startsWith(bleCapturePrefix)) {
      const bleMessage = JSON.parse(line.substr(bleCapturePrefix.length));
      bleMessageList.push(bleMessage);
    } else if (line.startsWith('--------- beginning of ')) {
      // skip
    } else if (line.startsWith('Running "RnBleSandboxCapture" with ')) {
      // skip
    } else {
      console.log(line);
    }
  });
});
const captureName = 'deviceList'; // TODO: configure per capture test suite
const capturePath = `artifact/${captureName}.capture.json`;
fs.writeFileSync(capturePath, JSON.stringify(bleMessageList, null, 2));
console.log(`BLE capture file saved in ${capturePath}`);

// stop adb logcat
logcat.kill();
