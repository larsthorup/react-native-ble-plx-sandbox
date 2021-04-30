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
import { Provider } from 'react-redux';
import thunkMiddleware from 'redux-thunk';
import { applyMiddleware, compose, createStore } from 'redux';
import { reducer } from './store';
import { deviceScanning } from './saga';

const middleware = [thunkMiddleware];
const store = createStore(reducer, compose(applyMiddleware(...middleware)));
store.dispatch(deviceScanning);

const App: () => Node = () => {
  return (
    <Provider store={store}>
      <DeviceList />
    </Provider>
  );
};

export default App;
