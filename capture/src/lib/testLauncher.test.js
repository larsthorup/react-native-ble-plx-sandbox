import * as fs from 'fs';
import { expect } from 'chai';
import { launch } from './testLauncher.js';
import { Readable } from 'stream';
import chalk from 'chalk';
import Mocha from 'mocha';
import { MochaEventReporter } from './MochaEventReporter.js';
import { stringifyTestRunnerEvent } from './testRunnerJsonProtocol.js';

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
  describe('passing with expected number of failures', () => {
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

      const mocha = new Mocha();
      mocha.addFile('./src/lib/testLauncher.test.simulated.cjs');
      const mochaOutput = [];
      const mochaLogger = (runnerEvent) => mochaOutput.push(stringifyTestRunnerEvent(runnerEvent));
      mocha.reporter(MochaEventReporter, { logger: mochaLogger });
      const mochaFailureCount = await new Promise((resolve) => {
        mocha.run(resolve);
      });
      expect(mochaFailureCount).to.equal(expectedFailCount);
      const testRunnerOutput = mochaOutput.join('\n');

      const spawn = (cmd, args) => {
        expect(cmd).to.equal('adb');
        expect(args).to.deep.equal(['logcat', '-v', 'raw', '-s', 'ReactNativeJS:V']);

        const stdout = Readable.from([testRunnerOutput]);
        return {
          stdout,
          kill: () => { },
        };
      };
      const { exitCode } = await launch({ appName, env, exec, expectedFailCount, log, spawn });
      expect(exitCode).to.equal(0);
      const expectedOutput = [
        'Launching test runner on device...',
        'Allowing app to run with necessary permissions',
        'Running tests...',
        '> ',
        '> simulated',
        `  ${chalk.green('√')} should add (\\d+ ms)`,
        `  ${chalk.red('X')} should fail: expected 1 to equal 4 (\\d+ ms)`,
        '  (undefined ms)',
        '  (undefined ms)',
        'Done!',
        'Success (1 test failed as expected)!',
      ];
      for (let i = 0; i < output.length; ++i) {
        const regex = new RegExp(expectedOutput[i]
          .replaceAll('\u001b[', '\u001b\\[')
          .replaceAll('(', '\\(')
          .replaceAll(')', '\\)'),
        );
        expect(output[i]).to.match(regex);
      }
      // TODO: capture file
    });
  });

  describe('failing', () => {
  });
});
