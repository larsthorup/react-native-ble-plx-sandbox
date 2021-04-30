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
