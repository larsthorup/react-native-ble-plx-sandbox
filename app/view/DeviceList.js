import React, { useState } from 'react';

import { useSelector } from 'react-redux';

import {
  ActivityIndicator,
  FlatList,
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Section from './Section';

const DeviceItem = ({ id }) => {
  const [selected, setSelected] = useState(false);
  const { name } = useSelector((state) => state.ble.device[id]);
  const toggleSelected = () => {
    setSelected(!selected);
  };
  const style = {
    ...styles.deviceItem,
    ...(selected && styles.deviceItemSelected),
  };
  const pressableLabel = selected ? `Disconnect from "${name}"` : `Connect to "${name}"`;
  return (
    <Pressable
      accessibilityLabel={pressableLabel}
      onPress={toggleSelected}
    >
      <View
        accessibilityLabel="BLE device"
        style={style}
      >
        <Text
          style={styles.deviceName}
        >
          {name}
        </Text>
      </View>
      {selected && (
        <ActivityIndicator
          accessibilityLabel={`Connecting to "${name}"`}
          color={styles.deviceItemLoading.color}
          size="small"
        />
      )}
    </Pressable>
  );
};

const DeviceList = () => {
  const powerState = useSelector((state) => state.ble.powerState);
  const deviceSet = useSelector((state) => state.ble.deviceSet);
  const deviceIdList = Object.keys(deviceSet).sort();
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
        data={deviceIdList}
        renderItem={({ item }) => (<DeviceItem id={item} />)}
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
  deviceItemLoading: {
    color: 'lightyellow',
  },
  deviceItemSelected: {
    backgroundColor: '#555555',
  },
  deviceName: {
    color: 'lightyellow',
  },
  deviceState: {
    color: 'white',
  },
});

export default DeviceList;
