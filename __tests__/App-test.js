/**
 * @format
 */

import 'react-native';
import React from 'react';


jest.mock('../ble', () => {
  const mockBleManager = {
    startDeviceScan: (uuidList, scanOptions, listener) => {
      // TODO: wait for test to trigger this event
      const error = null;
      listener(error, { name: 'SomeDeviceName' });
      listener(error, { name: 'SomeOtherName' });
    },
    stopDeviceScan: () => { }
  };
  return () => {
    return mockBleManager;
  };
});

import App from '../App';

import { render, waitFor } from '@testing-library/react-native';


it('renders correctly', async () => {
  const { getByA11yLabel } = render(<App />);
  expect(getByA11yLabel('BLE state')).toHaveTextContent('PoweredOn');
  expect(getByA11yLabel('BLE device list')).toHaveTextContent('');
  await waitFor(() => expect(getByA11yLabel('BLE device list')).toHaveTextContent('SomeDeviceName, SomeOtherName'));
});
