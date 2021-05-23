import * as fs from 'fs';
import { expect } from 'chai';
import { launch } from './testLauncher.js';
import { Readable } from 'stream';
import chalk from 'chalk';

// inject child_process mock
// verify logcat clean
// mock logcat stream with generated file
// verify adb clear
// verify adb launch
// verify adb uiautomator
// verify adb pull, return recorded screenshot
// verify adb tap
// compare actual console output with expected output
// compare actual exit code with expected exit code

const appName = 'SomeAppName';
const env = {
  PACKAGE_NAME: 'some.package.name',
};

const execMock = (expected) => {
  let next = 0;
  return async (cmdActual) => {
    const { cmd: cmdExpected, effect, result } = expected[next];
    expect(cmdActual).to.equal(cmdExpected);
    ++next;
    if (effect) {
      effect();
    }
    return result;
  };
};

describe('testLauncher', () => {
  describe('successful', () => {
    it('exits with 0 and produces correct output and capture file', async () => {
      const exec = execMock([
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
      const expectedFailCount = 1;
      const output = [];
      const log = (line) => output.push(line);
      const spawn = (cmd, args) => {
        expect(cmd).to.equal('adb');
        expect(args).to.deep.equal(['logcat', '-v', 'raw', '-s', 'ReactNativeJS:V']);
        // TODO: produce this with mocha :)
        const testRunnerOutput = [
          'TestRunner: {"event": "start"}',
          'TestRunner: {"event": "fail", "name": "some test", "message": "some error message", "duration": 42}',
          'some output',
          'TestRunner: {"event": "complete"}',
        ].join('\n');
        const stdout = Readable.from([testRunnerOutput]);
        return {
          stdout,
          kill: () => { },
        };
      };
      const { exitCode } = await launch({ appName, env, exec, expectedFailCount, log, spawn });
      expect(exitCode).to.equal(0);
      expect(output).to.deep.equal([
        'Launching test runner on device...',
        'Allowing app to run with necessary permissions',
        'Running tests...',
        `  ${chalk.red('X')} some test: some error message (42 ms)`,
        `    ${chalk.grey('some output')}`,
        'Done!',
        'Success (1 test failed as expected)!',
      ]);
      // TODO: capture file
    });
  });

  describe('failing', () => {
  });
});
