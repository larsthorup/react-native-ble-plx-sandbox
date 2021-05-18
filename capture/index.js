import { AppRegistry } from 'react-native';
import TestRunnerScreen from './src/view/TestRunnerScreen';
import { name as appName } from './app.json';

import './src/test/setup.test';
import './src/test/calc.test';
import './src/test/deviceList.capture.test';
import './src/test/deviceList-empty.capture.test';

AppRegistry.registerComponent(appName, () => TestRunnerScreen);
