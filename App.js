/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React, { useEffect, useState } from 'react';
import type { Node } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';

import { BleManager } from 'react-native-ble-plx';

// TODO: encapsulate
const bleManager = new BleManager();

const Section = ({ children, title }): Node => {
  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>
        {title}
      </Text>
      <Text style={styles.sectionDescription}>
        {children}
      </Text>
    </View>
  );
};

const App: () => Node = () => {
  console.log('App.render');
  const [bleState, setBleState] = useState('PoweredOn'); // TODO: bleManager.onStateChange
  const [deviceSet, setDeviceSet] = useState({});
  useEffect(() => {
    if (bleState !== 'PoweredOn') return;
    console.log('App.deviceScanEffect.enter');
    bleManager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.log('bleManager.onDeviceScanError', error);
        return;
      }
      if (device.name && !deviceSet[device.name]) {
        console.log(device.name);
        setDeviceSet(Object.assign({}, deviceSet, { [device.name]: true }));
      }
      // TODO: remove device
    });
    return () => {
      console.log('App.deviceScanEffect.enter');
      bleManager.stopDeviceScan();
    }
  });
  return (
    <SafeAreaView>
      <StatusBar />
      <ScrollView contentInsetAdjustmentBehavior="automatic">
        <View>
          <Section title="BLE Sandbox" />
          <Section title="BLE state">
            {bleState}
          </Section>
          <Section title="BLE device list">
            {Object.keys(deviceSet).join(', ')}
          </Section>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: '600',
  },
  sectionDescription: {
    color: 'white',
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
  },
  highlight: {
    fontWeight: '700',
  },
});

export default App;
