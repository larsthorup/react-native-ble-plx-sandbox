import { promisify } from 'util';
import * as cp from 'child_process';

import chalk from 'chalk';

const exec = promisify(cp.exec);
const { spawn } = cp;

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
const prefix = 'TestRunner: ';
let then = 0;
await new Promise((resolve) => {
  // TODO: collect into lines
  logcat.stdout.on('data', (data) => {
    const text = data.toString();
    if (text.startsWith(prefix)) {
      const runnerEvent = JSON.parse(text.substr(prefix.length));
      const ms = Date.now() - then;
      then = Date.now();
      const { event, message, name } = runnerEvent;
      switch (event) {
        case 'complete':
          console.log('Done!');
          resolve();
          break;
        case 'fail':
          console.log(`${chalk.red('X')} ${name}: ${message} (${ms} ms)`);
          break;
        case 'pass':
          console.log(`${chalk.green('√')} ${name} (${ms} ms)`);
          break;
        case 'start':
          console.log('Running tests...');
          break;
      }
    } else if (text.startsWith('--------- beginning of ')) {
      // skip
    } else if (text.startsWith('Running "RnBleSandboxCapture" with ')) {
      // skip
    } else {
      console.log(text);
    }
  });
});

// stop adb logcat
logcat.kill();
