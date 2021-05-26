import * as fs from 'fs';
import { expect } from 'chai';
import * as cp from 'child_process';
import { Readable } from 'stream';

import chalk from 'chalk';

import { launch } from './testLauncher.js';

const appName = 'SomeAppName';
const env = {
  PACKAGE_NAME: 'some.package.name',
};

const execMock = (expected) => {
  let next = 0;
  return async (cmdActual) => {
    const { cmd: cmdExpected, effect, result } = expected[next] || {};
    expect(cmdActual).to.equal(cmdExpected);
    ++next;
    if (effect) {
      effect();
    }
    return result;
  };
};

const createExecMock = () => {
  return execMock([
    { cmd: 'adb logcat -c' },
    { cmd: `adb shell pm clear ${env.PACKAGE_NAME}` },
    { cmd: `adb shell am start -n '${env.PACKAGE_NAME}/.MainActivity'` },
    { cmd: 'adb shell uiautomator dump', result: { stdout: 'UI hierchary dumped to: /sdcard/window_dump.xml' } },
    {
      cmd: 'adb pull /sdcard/window_dump.xml ./output/view.xml', effect: () => {
        const viewXml = '<node index="0" text="While using the app" resource-id="com.android.permissioncontroller:id/permission_allow_foreground_only_button" class="android.widget.Button" package="com.google.android.permissioncontroller" content-desc="" checkable="false" checked="false" clickable="true" enabled="true" focusable="true" focused="false" scrollable="false" long-clickable="false" password="false" selected="false" bounds="[72,1667][1008,1775]" />';
        fs.writeFileSync('./output/view.xml', viewXml);
      },
    },
    { cmd: 'adb shell input tap 540 1721' },
  ]);
};

const mockSpawn = async () => {
  // Note: run mocha out of process to allow the test and the imported files to use ES6 modules,
  // which wouldn't work with mocha.addFile()
  const { stdout: testRunnerOutput } = await new Promise((resolve, reject) => {
    cp.exec('node src/lib/test/testLauncher.test.runner.js', (error, stdout, stderr) => {
      if (error && stderr) {
        reject(error);
      } else {
        resolve({
          exitCode: error ? error.code : 0,
          stdout,
        });
      }
    });
  });

  const spawn = (cmd, args) => {
    expect(cmd).to.equal('adb');
    expect(args).to.deep.equal(['logcat', '-v', 'raw', '-s', 'ReactNativeJS:V']);

    const stdout = Readable.from([testRunnerOutput]);
    return {
      stdout,
      kill: () => { },
    };
  };
  return spawn;
};

const expectOutputMatch = (output, expectedOutputRegExp) => {
  for (let i = 0; i < output.length; ++i) {
    const regexp = new RegExp(expectedOutputRegExp[i]
      .replaceAll('\u001b[', '\u001b\\[')
      .replaceAll('(', '\\(')
      .replaceAll(')', '\\)'),
    );
    try {
      expect(output[i]).to.match(regexp);
    } catch (err) {
      console.log(output);
      throw err;
    }
  }
};

const expectedCapturePath = 'artifact/testLauncher.test.simulated.capture.json';

const expectedOutputRegExp = [
  'Launching test runner on device...',
  'Allowing app to run with necessary permissions',
  'Running tests...',
  '>',
  '> calc',
  `    ${chalk.grey('2 \\+ 2 === 4')}`,
  `  ${chalk.green('√')} should add (\\d+ ms)`,
  `  ${chalk.red('X')} should fail: expected 1 to equal 4 (\\d+ ms)`,
  '> calc - complete',
  '> state',
  `(BLE capture file saved in ${expectedCapturePath}: 1 records)`,
  `  ${chalk.green('√')} should record command with request and response (\\d+ ms)`,
  '> state - complete',
  '> complete',
  'Done!',
];

const expectedCaptureFile = [
  {
    'type': 'command',
    'command': 'state',
    'request': {},
    'response': 'some-state',
  },
];

describe('testLauncher', () => {
  describe('passing with expected number of failures', () => {
    it('exits with 0 and produces correct output and capture file', async () => {
      const exec = createExecMock();
      const expectedFailCount = 1;
      const output = [];
      const log = (line) => output.push(line);
      const spawn = await mockSpawn();
      const { exitCode } = await launch({ appName, env, exec, expectedFailCount, log, spawn });
      expect(exitCode).to.equal(0);
      expectOutputMatch(output, expectedOutputRegExp.concat([
        'Success (1 test failed as expected)!',
      ]));
      const captureFile = JSON.parse(fs.readFileSync(expectedCapturePath));
      expect(captureFile).to.deep.equal(expectedCaptureFile);
    });
  });

  describe('failing', () => {
    it('exits with 1 and produces correct output and capture file', async () => {
      // given an expectation of no tests to fail
      const expectedFailCount = 0;
      const exec = createExecMock();
      const output = [];
      const log = (line) => output.push(line);
      const spawn = await mockSpawn();
      const { exitCode } = await launch({ appName, env, exec, expectedFailCount, log, spawn });
      expect(exitCode).to.equal(1);
      expectOutputMatch(output, expectedOutputRegExp.concat([
        '1 test failed!',
      ]));
      const captureFile = JSON.parse(fs.readFileSync(expectedCapturePath));
      expect(captureFile).to.deep.equal(expectedCaptureFile);
    });
  });
});
