import * as fs from 'fs';
import 'react-native';
import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import DeviceList from '../view/DeviceList';
import { configureStore } from '../state';
import { withStore } from '../lib/withStore';
import { autoMockBleManager } from '../lib/ble';
import { act } from 'react-test-renderer';

jest.mock('../lib/ble');

describe('DeviceList', () => {
  it('should display empty list of BLE devices', async () => {
    const bleManagerMock = autoMockBleManager([
      {
        'command': 'onStateChange',
        'request': {
          'emitCurrentState': true,
        },
      },
      {
        'event': 'onStateChange',
        'powerState': 'PoweredOn',
      },
      { label: 'powered' },
    ]);

    // when: render the app
    const { queryAllByA11yLabel, getByA11yLabel } = render(withStore(<DeviceList />, configureStore()));

    // when: simulating some BLE traffic
    act(() => {
      bleManagerMock.playUntil('powered'); // Note: causes re-render, so act() is needed
    });

    // then: initially no devices are displayed
    expect(getByA11yLabel('BLE state')).toHaveTextContent('PoweredOn');
    expect(queryAllByA11yLabel('BLE device')).toEqual([]);
  });

  it('should display list of BLE devices', async () => {
    const bleManagerMock = autoMockBleManager([
      {
        'command': 'onStateChange',
        'request': {
          'emitCurrentState': true,
        },
      },
      {
        'event': 'onStateChange',
        'powerState': 'PoweredOn',
      },
      { event: 'onDeviceScan', device: { id: 'SND', name: 'SomeDeviceName' } },
      { event: 'onDeviceScan', device: { id: 'SON', name: 'SomeOtherName' } },
      { label: 'scanned' },
    ]);

    // when: render the app
    const { getAllByA11yLabel } = render(withStore(<DeviceList />, configureStore()));

    // when: simulating some BLE traffic
    act(() => {
      bleManagerMock.playUntil('scanned'); // Note: causes re-render, so act() is needed
    });

    // then: eventually the scanned devices are displayed
    expect(getAllByA11yLabel('BLE device')).toEqual([
      expect.toHaveTextContent('SomeDeviceName'),
      expect.toHaveTextContent('SomeOtherName'),
    ]);
  });

  it('should display list of BLE devices as they appear', async () => {
    const bleManagerMock = autoMockBleManager([
      {
        'command': 'onStateChange',
        'request': {
          'emitCurrentState': true,
        },
      },
      {
        'event': 'onStateChange',
        'powerState': 'PoweredOn',
      },
      { event: 'onDeviceScan', device: { id: 'SDN', name: 'SomeDeviceName' } },
      { label: 'some-scanned' },
      { event: 'onDeviceScan', device: { id: 'SON', name: 'SomeOtherName' } },
      { label: 'all-scanned' },
    ]);

    // when: render the app
    const { getAllByA11yLabel } = render(withStore(<DeviceList />, configureStore()));

    // when: simulating some BLE traffic
    act(() => {
      bleManagerMock.playUntil('some-scanned'); // Note: causes re-render, so act() is needed
    });

    // then: eventually the scanned devices are displayed
    expect(getAllByA11yLabel('BLE device')).toEqual([
      expect.toHaveTextContent('SomeDeviceName'),
    ]);

    // when: simulating remaining BLE traffic
    act(() => {
      bleManagerMock.playUntil('all-scanned'); // Note: causes re-render, so act() is needed
    });

    // then: eventually the scanned devices are displayed
    expect(getAllByA11yLabel('BLE device')).toEqual([
      expect.toHaveTextContent('SomeDeviceName'),
      expect.toHaveTextContent('SomeOtherName'),
    ]);
  });

  it('should load and show device info', async () => {
    const recording = JSON.parse(fs.readFileSync('../capture/artifact/deviceList.capture.json')); // TODO: relative path
    const bleManagerMock = autoMockBleManager(recording);

    // when: render the app
    const { getByA11yLabel, queryByA11yLabel } = render(withStore(<DeviceList />, configureStore()));

    // then: no loading indicator is shown
    expect(queryByA11yLabel('Connecting to "The Speaker"')).toBeFalsy();

    // when: simulating some BLE traffic
    act(() => {
      bleManagerMock.playUntil('scanned'); // Note: causes re-render, so act() is needed
    });

    // when: clicking a device
    fireEvent.press(getByA11yLabel('Connect to "The Speaker"'));

    // then: loading indicator is shown
    expect(queryByA11yLabel('Connecting to "The Speaker"')).toBeTruthy();

    // then: eventually battery level is shown
    await waitFor(() => getByA11yLabel('"The Speaker" battery level'));
    expect(getByA11yLabel('"The Speaker" battery level')).toHaveTextContent('42%');

    // then: loading indicator is no longer shown
    expect(queryByA11yLabel('Connecting to "The Speaker"')).toBeFalsy();
  });
});
