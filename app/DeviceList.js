import React from 'react';
import type { Node } from 'react';

import { useSelector } from 'react-redux';

import {
  FlatList,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Section from './Section';

const DeviceItem = ({ name }) => {
  return (
    <View accessibilityLabel="BLE device" style={styles.deviceItem}>
      <Text style={styles.deviceName} accessibilityLabel={name}>{name}</Text>
    </View>
  );
};

const DeviceList: () => Node = () => {
  const powerState = useSelector((state) => state.ble.powerState);
  const deviceSet = useSelector((state) => state.ble.deviceSet);
  const deviceNameList = Object.keys(deviceSet).sort();
  return (
    <SafeAreaView>
      <StatusBar />
      <Section title="BLE Sandbox" />
      <Section title="BLE state">
        <Text accessibilityLabel="BLE state" style={styles.deviceState}>
          {powerState}
        </Text>
      </Section>
      <Section title="BLE device list" />
      <FlatList
        accessibilityLabel="BLE device list"
        data={deviceNameList}
        renderItem={({ item }) => (<DeviceItem name={item} />)}
        keyExtractor={(item) => item}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  deviceItem: {
    backgroundColor: '#444444',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 20,
  },
  deviceName: {
    color: 'lightyellow',
  },
  deviceState: {
    color: 'white',
  },
});

export default DeviceList;
