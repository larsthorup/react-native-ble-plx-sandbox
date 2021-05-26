/* global mocha */
import '../../node_modules/mocha/mocha.js';
import { MochaEventReporter } from './MochaEventReporter.js';
import mochaConfig from '../../.mocharc.js';

global.location = {};
mocha.setup('bdd');
mocha.timeout(mochaConfig.timeout || 2000);

export const run = async (logger) => {
  mocha.reporter(MochaEventReporter, { logger });
  return new Promise((resolve) => {
    mocha.run(resolve);
  });
};

export default mocha;
