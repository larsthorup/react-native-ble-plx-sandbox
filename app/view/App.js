import React from 'react';

import DeviceList from './DeviceList';
import { configureStore } from '../state';
import { withStore } from '../lib/withStore';

const store = configureStore();

const App = () => {
  return withStore(<DeviceList />, store);
};

export default App;
