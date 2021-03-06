/* global mocha */
// Note: we need the embeddable version of mocha, not the CLI
import '../node_modules/mocha/mocha.js';
import { MochaEventReporter } from '@larsthorup/react-native-mocha';

global.location = {};
mocha.setup('bdd');

export const run = async (logger) => {
  mocha.reporter(MochaEventReporter, { logger });
  return new Promise((resolve) => {
    mocha.run(resolve);
  });
};

export default mocha;
