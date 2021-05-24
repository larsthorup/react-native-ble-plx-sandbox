/* global mocha */
import '../../node_modules/mocha/mocha.js';
import { MochaEventReporter } from './MochaEventReporter.js';

global.location = {};
mocha.setup('bdd');
mocha.timeout(10000); // TODO: configure

export const run = async (logger) => {
  mocha.reporter(MochaEventReporter, { logger });
  return new Promise((resolve) => {
    mocha.run(resolve);
  });
};

