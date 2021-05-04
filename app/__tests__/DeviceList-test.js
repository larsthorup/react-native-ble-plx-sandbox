import 'react-native';
import React from 'react';
import { render } from '@testing-library/react-native';

import DeviceList from '../DeviceList';
import { configureStore } from '../store';
import { withStore } from '../withStore';
import { autoMockBleManager } from '../ble';
import { act } from 'react-test-renderer';

jest.mock('../ble');

describe('DeviceList', () => {
  it('should display empty list of BLE devices', async () => {
    autoMockBleManager([]);

    // when: render the app
    const { getByA11yLabel } = render(withStore(<DeviceList />, configureStore()));

    // then: initially no devices are displayed
    expect(getByA11yLabel('BLE state')).toHaveTextContent('PoweredOn');
    expect(getByA11yLabel('BLE device list')).toHaveTextContent('');
  });

  it('should display list of BLE devices', async () => {
    const bleManagerMock = autoMockBleManager([
      { event: 'onDeviceScan', device: { name: 'SomeDeviceName' } },
      { event: 'onDeviceScan', device: { name: 'SomeOtherName' } },
      { label: 'scanned' },
    ]);

    // when: render the app
    const { getByA11yLabel } = render(withStore(<DeviceList />, configureStore()));

    // when: simulating some BLE traffic
    act(() => {
      bleManagerMock.playUntil('scanned'); // Note: causes re-render, so act() is needed
    });

    // then: eventually the scanned devices are displayed
    expect(getByA11yLabel('BLE device list')).toHaveTextContent(
      'SomeDeviceName, SomeOtherName',
    );
  });

  it('should display list of BLE devices as they appear', async () => {
    const bleManagerMock = autoMockBleManager([
      { event: 'onDeviceScan', device: { name: 'SomeDeviceName' } },
      { label: 'some-scanned' },
      { event: 'onDeviceScan', device: { name: 'SomeOtherName' } },
      { label: 'all-scanned' },
    ]);

    // when: render the app
    const { getByA11yLabel } = render(withStore(<DeviceList />, configureStore()));

    // when: simulating some BLE traffic
    act(() => {
      bleManagerMock.playUntil('some-scanned'); // Note: causes re-render, so act() is needed
    });

    // then: eventually the scanned devices are displayed
    expect(getByA11yLabel('BLE device list')).toHaveTextContent(
      'SomeDeviceName',
    );

    // when: simulating remaining BLE traffic
    act(() => {
      bleManagerMock.playUntil('all-scanned'); // Note: causes re-render, so act() is needed
    });

    // then: eventually the scanned devices are displayed
    expect(getByA11yLabel('BLE device list')).toHaveTextContent(
      'SomeDeviceName, SomeOtherName',
    );
  });
});
