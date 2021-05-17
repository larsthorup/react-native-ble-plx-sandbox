import React from 'react';
import { useSelector } from 'react-redux';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
} from 'react-native';

import Section from './Section';
import DeviceList from './DeviceList';

const DeviceListScreen = () => {
  const powerState = useSelector((state) => state.ble.powerState);
  return (
    <SafeAreaView style={styles.top}>
      <StatusBar />
      <Section title="BLE Sandbox" />
      <Section title="BLE state">
        <Text accessibilityLabel="BLE state" style={styles.deviceState}>
          {powerState}
        </Text>
      </Section>
      <Section title="BLE device list" />
      <DeviceList />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  top: {
    backgroundColor: '#888',
    height: '100%',
  },
  deviceState: {
    color: 'white',
  },
});

export default DeviceListScreen;
