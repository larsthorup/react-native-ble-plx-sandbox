const path = require('path');

module.exports = {
  spec: path.join(__dirname, './testLauncher.test.simulated.js'),
  reporter: './src/lib/MochaEventReporter.cjs',
};