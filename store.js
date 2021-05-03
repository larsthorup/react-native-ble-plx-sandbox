import { applyMiddleware, compose, createStore } from 'redux';
import thunkMiddleware from 'redux-thunk';

import { deviceScanning } from './service';

export const initialState = {
  ble: {
    powerState: null,
    deviceSet: {},
  },
};

const reducerMap = {};

export const register = (type, reducer) => {
  const actionCreator = (args) => ({ type, ...args });
  actionCreator.type = type;
  if (reducer) {
    reducerMap[type] = reducer;
  }
  return actionCreator;
};

export const reducer = (state, action) => {
  if (typeof state === 'undefined') {
    return initialState;
  }

  const reducerForType = reducerMap[action.type];
  if (!reducerForType) {
    return state;
  }

  return reducerForType(state, action);
};

export const configureStore = () => {
  const middleware = [thunkMiddleware];
  const store = createStore(reducer, compose(applyMiddleware(...middleware)));
  store.dispatch(deviceScanning);
  return store;
};

export const bleDeviceScanned = register('bleDeviceScanned', (state, { device }) => {
  if (!state.ble.deviceSet[device.name]) {
    return {
      ...state,
      ble: {
        ...state.ble,
        deviceSet: {
          ...state.ble.deviceSet,
          [device.name]: true,
        },
      },
    };
  } else {
    return state;
  }
});

export const blePowerStateChanged = register('blePowerStateChanged', (state, { powerState }) => {
  if (state.ble.powerState !== powerState) {
    return {
      ...state,
      ble: {
        ...state.ble,
        powerState,
      },
    };
  } else {
    return state;
  }
});
