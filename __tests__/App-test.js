/**
 * @format
 */

import 'react-native';
import React from 'react';

jest.mock('../ble', () => {
  const mockBleManager = {
    startDeviceScan: (uuidList, scanOptions, onDeviceScan) => {
      // TODO: wait for bleMock to trigger this event
      onDeviceScan(null, { name: 'SomeDeviceName' });
      onDeviceScan(null, { name: 'SomeOtherName' });
    },
    stopDeviceScan: () => { },
  };
  return () => {
    return mockBleManager;
  };
});

import App from '../App';

import { render, waitFor } from '@testing-library/react-native';

const bleMock = {
  playUntil: (label) => {
    // TODO: trigger events
  },
};

describe('App', () => {
  it('should display list of BLE devices', async () => {

    // when: render the app
    const { getByA11yLabel } = render(<App />);

    // then: initially no devices are displayed
    expect(getByA11yLabel('BLE state')).toHaveTextContent('PoweredOn');
    expect(getByA11yLabel('BLE device list')).toHaveTextContent('');

    // when: simulating some BLE traffic
    bleMock.playUntil('scanned');

    // then: eventually the scanned devices are displayed
    await waitFor(() =>
      expect(getByA11yLabel('BLE device list')).toHaveTextContent(
        'SomeDeviceName, SomeOtherName',
      ),
    );
  });
});
