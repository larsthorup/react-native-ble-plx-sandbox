/**
 * @format
 */

import 'react-native';
import React from 'react';


jest.mock('../ble', () => {
  const mockBleManager = {
    // TODO: auto mock some scanned device
    startDeviceScan: () => { },
    stopDeviceScan: () => { }
  };
  return jest.fn(() => {
    return mockBleManager;
  });
});

import App from '../App';

import { render } from '@testing-library/react-native';


it('renders correctly', async () => {
  const { getByA11yLabel } = render(<App />);
  expect(getByA11yLabel('BLE state')).toHaveTextContent('PoweredOn');
  expect(getByA11yLabel('BLE device list')).toHaveTextContent('');
  // TODO: await waitFor scan results
});
