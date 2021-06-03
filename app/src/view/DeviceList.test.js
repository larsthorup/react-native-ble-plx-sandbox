import * as fs from 'fs';
import 'react-native';
import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import DeviceListScreen from './DeviceListScreen';
import { configureStore } from '../state';
import { withStore } from '../lib/withStore';
import { getBleManager } from '../singleton/bleManager';
import { act } from 'react-test-renderer';

describe('DeviceList', () => {
  describe('auto-mocking', () => {
    // for (const _ of '*'.repeat(1000))
    it('should load and show device info', async () => {
      const spec = JSON.parse(fs.readFileSync('../recorder/artifact/deviceList.recording.json'));
      const { blePlayer } = getBleManager();
      blePlayer.mockWith(spec);

      // when: render the app
      const { getByA11yLabel, queryByA11yLabel } = render(withStore(<DeviceListScreen />, configureStore()));

      // then: no loading indicator is shown
      expect(queryByA11yLabel('Connecting to "The Speaker"')).toBeFalsy();

      // when: simulating BLE scan response
      act(() => {
        blePlayer.playUntil('scanned'); // Note: causes re-render, so act() is needed
      });

      // when: clicking a device
      fireEvent.press(getByA11yLabel('Connect to "The Speaker"'));

      // then: loading indicator is shown
      expect(queryByA11yLabel('Connecting to "The Speaker"')).toBeTruthy();

      // then: eventually battery level is shown
      await waitFor(() => getByA11yLabel('"The Speaker" battery level'));
      expect(getByA11yLabel('"The Speaker" battery level')).toHaveTextContent('🔋 42%');

      // then: eventually signal strength is shown
      expect(getByA11yLabel('"The Speaker" signal')).toHaveTextContent('📶 -42');

      // then: loading indicator is no longer shown
      expect(queryByA11yLabel('Connecting to "The Speaker"')).toBeFalsy();

      // when: clicking the device again
      fireEvent.press(getByA11yLabel('Disconnect from "The Speaker"'));

      // then: battery level is no longer shown
      expect(queryByA11yLabel('"The Speaker" battery level')).toBeFalsy();

      // finally
      blePlayer.expectFullCoverage();
    });
  });

  describe('manual mocking', () => {
    it('should display empty list of BLE devices', async () => {
      const { blePlayer } = getBleManager();
      blePlayer.mockWith({
        records: [
          {
            'type': 'command',
            'command': 'onStateChange',
            'request': {
              'emitCurrentState': true,
            },
          },
          {
            'type': 'event',
            'event': 'stateChange',
            'args': {
              'powerState': 'PoweredOn',
            },
          },
          {
            'type': 'command',
            'command': 'startDeviceScan',
            'request': {
              'uuidList': null,
              'scanOptions': null,
            },
          },
          {
            'type': 'label',
            'label': 'powered',
          },
        ],
        version: '1.0.0',
      });

      // when: render the app
      const { queryAllByA11yLabel, getByA11yLabel } = render(withStore(<DeviceListScreen />, configureStore()));

      // when: simulating some BLE traffic
      act(() => {
        blePlayer.playUntil('powered'); // Note: causes re-render, so act() is needed
      });

      // then: initially no devices are displayed
      expect(getByA11yLabel('BLE state')).toHaveTextContent('PoweredOn');
      expect(queryAllByA11yLabel('BLE device')).toEqual([]);

      // finally
      blePlayer.expectFullCoverage();
    });

    it('should display list of BLE devices', async () => {
      const { blePlayer } = getBleManager();
      blePlayer.mockWith({
        records: [
          {
            'type': 'command',
            'command': 'onStateChange',
            'request': {
              'emitCurrentState': true,
            },
          },
          {
            'type': 'event',
            'event': 'stateChange',
            'args': {
              'powerState': 'PoweredOn',
            },
          },
          {
            'type': 'command',
            'command': 'startDeviceScan',
            'request': {
              'uuidList': null,
              'scanOptions': null,
            },
          },
          { type: 'event', event: 'deviceScan', args: { device: { id: 'SND', name: 'SomeDeviceName' } } },
          { type: 'event', event: 'deviceScan', args: { device: { id: 'SON', name: 'SomeOtherName' } } },
          { type: 'label', label: 'scanned' },
        ],
        version: '1.0.0',
      });

      // when: render the app
      const { getAllByA11yLabel } = render(withStore(<DeviceListScreen />, configureStore()));

      // when: simulating some BLE traffic
      act(() => {
        blePlayer.playUntil('scanned'); // Note: causes re-render, so act() is needed
      });

      // then: eventually the scanned devices are displayed
      expect(getAllByA11yLabel('BLE device')).toEqual([
        expect.toHaveTextContent('SomeDeviceName'),
        expect.toHaveTextContent('SomeOtherName'),
      ]);

      // finally
      blePlayer.expectFullCoverage();
    });

    it('should display list of BLE devices as they appear', async () => {
      const { blePlayer } = getBleManager();
      blePlayer.mockWith({
        records: [
          {
            'type': 'command',
            'command': 'onStateChange',
            'request': {
              'emitCurrentState': true,
            },
          },
          {
            'type': 'event',
            'event': 'stateChange',
            'args': {
              'powerState': 'PoweredOn',
            },
          },
          {
            'type': 'command',
            'command': 'startDeviceScan',
            'request': {
              'uuidList': null,
              'scanOptions': null,
            },
          },
          { type: 'event', event: 'deviceScan', args: { device: { id: 'SDN', name: 'SomeDeviceName' } } },
          { type: 'label', label: 'some-scanned' },
          { type: 'event', event: 'deviceScan', args: { device: { id: 'SON', name: 'SomeOtherName' } } },
          { type: 'label', label: 'all-scanned' },
        ],
        version: '1.0.0',
      });

      // when: render the app
      const { getAllByA11yLabel } = render(withStore(<DeviceListScreen />, configureStore()));

      // when: simulating some BLE traffic
      act(() => {
        blePlayer.playUntil('some-scanned'); // Note: causes re-render, so act() is needed
      });

      // then: eventually the scanned devices are displayed
      expect(getAllByA11yLabel('BLE device')).toEqual([
        expect.toHaveTextContent('SomeDeviceName'),
      ]);

      // when: simulating remaining BLE traffic
      act(() => {
        blePlayer.playUntil('all-scanned'); // Note: causes re-render, so act() is needed
      });

      // then: eventually the scanned devices are displayed
      expect(getAllByA11yLabel('BLE device')).toEqual([
        expect.toHaveTextContent('SomeDeviceName'),
        expect.toHaveTextContent('SomeOtherName'),
      ]);

      // finally
      blePlayer.expectFullCoverage();
    });
  });
});
