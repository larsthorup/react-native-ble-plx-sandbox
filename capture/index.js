/**
 * @format
 */

import {AppRegistry} from 'react-native';
import TestRunner from './src/view/TestRunner';
import {name as appName} from './app.json';

import './src/test/calc.test';

AppRegistry.registerComponent(appName, () => TestRunner);
