export const initialState = {
  ble: {
    powerState: 'PoweredOn', // TODO: bleManager.onStateChange
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

export const deviceScanned = register('deviceScanned', (state, { device }) => {
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
