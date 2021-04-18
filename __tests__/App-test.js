/**
 * @format
 */

import 'react-native';
import React from 'react';


jest.mock('../ble', () => {
  const mockBleManager = {
    startDeviceScan: () => { },
    stopDeviceScan: () => { }
  };
  return jest.fn(() => {
    return mockBleManager;
  });
});

import App from '../App';

// Note: test renderer must be required after react-native.
import renderer, { act } from 'react-test-renderer';

it('renders correctly', async () => {
  // TODO: use react-native-testing-library
  await act(async () => {
    renderer.create(<App />);
  });
  // TODO: await waitFor scan results
});
