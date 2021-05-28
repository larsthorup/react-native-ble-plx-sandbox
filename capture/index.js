import { AppRegistry } from 'react-native';
import MochaRunnerScreen from './src/view/MochaRunnerScreen';
import { name as appName } from './app.json';
import mocha from './src/lib/mochaLoader';

import './src/test/setup.test';
import './src/test/calc.test';
import './src/test/deviceList.capture.test';
import './src/test/deviceList-empty.capture.test';

MochaRunnerScreen.mocha = mocha;
AppRegistry.registerComponent(appName, () => MochaRunnerScreen);
