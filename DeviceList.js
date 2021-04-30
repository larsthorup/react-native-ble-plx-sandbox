import React, { useEffect, useState } from 'react';
import type { Node } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import getBleManager from './ble';
import { useSelector } from 'react-redux';

const Section = ({ children, title }): Node => {
  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionDescription} accessibilityLabel={title}>
        {children}
      </Text>
    </View>
  );
};

const DeviceList: () => Node = () => {
  const powerState = useSelector((state) => state.ble.powerState);
  const [deviceSet, setDeviceSet] = useState({});
  useEffect(() => {
    if (powerState !== 'PoweredOn') {
      return;
    }
    const bleManager = getBleManager();
    const uuidList = null;
    const scanOptions = null;
    bleManager.startDeviceScan(uuidList, scanOptions, (error, device) => {
      if (error) {
        console.log('bleManager.onDeviceScanError', error);
        return;
      }
      if (device.name && !deviceSet[device.name]) {
        // console.log('bleManager.onDeviceScan', device.name);
        setDeviceSet(Object.assign({}, deviceSet, { [device.name]: true }));
      }
      // TODO: remove device
    });
    return () => {
      bleManager.stopDeviceScan();
    };
  });
  return (
    <SafeAreaView>
      <StatusBar />
      <ScrollView contentInsetAdjustmentBehavior="automatic">
        <View>
          <Section title="BLE Sandbox" />
          <Section title="BLE state">{powerState}</Section>
          <Section title="BLE device list">
            {Object.keys(deviceSet).sort().join(', ')}
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

export default DeviceList;
