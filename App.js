/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React from 'react';
import type { Node } from 'react';

import DeviceList from './DeviceList';
import { configureStore } from './store';
import { withStore } from './withStore';

const store = configureStore();

const App: () => Node = () => {
  return withStore(<DeviceList />, store);
};

export default App;
