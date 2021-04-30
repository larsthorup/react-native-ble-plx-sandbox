import 'react-native';
import React from 'react';
import { render, waitFor } from '@testing-library/react-native';

import App from '../App';
import getBleManager from '../ble';

jest.mock('../ble');

describe('App', () => {

  it('should display list of BLE devices', async () => {
    const bleManagerMock = getBleManager();

    // when: render the app
    const { getByA11yLabel } = render(<App />);

    // then: initially no devices are displayed
    expect(getByA11yLabel('BLE state')).toHaveTextContent('PoweredOn');
    expect(getByA11yLabel('BLE device list')).toHaveTextContent('');

    // when: simulating some BLE traffic
    bleManagerMock.playUntil('scanned');

    // then: eventually the scanned devices are displayed
    await waitFor(() =>
      expect(getByA11yLabel('BLE device list')).toHaveTextContent(
        'SomeDeviceName, SomeOtherName',
      ),
    );
  });
});
