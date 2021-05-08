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
import { useDispatch } from 'react-redux';
import { deviceConnecting } from '../service/deviceConnecting';

const DeviceItem = ({ id }) => {
  const dispatch = useDispatch();
  const [selected, setSelected] = useState(false);
  const { name } = useSelector((state) => state.ble.device[id].device);
  const connecting = useSelector((state) => state.ble.device[id].connecting);
  const batteryLevel = useSelector((state) => state.ble.device[id].batteryLevel);
  const toggleSelected = () => {
    if (!selected) {
      dispatch(deviceConnecting({ id }));
      setSelected(true);
    } else {
      setSelected(false);
    }
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
      {selected && connecting && (
        <ActivityIndicator
          accessibilityLabel={`Connecting to "${name}"`}
          color={styles.deviceItemLoading.color}
          size="small"
        />
      )}
      {selected && batteryLevel && (
        <Text
          accessibilityLabel={`"${name}" battery level`}
          style={styles.deviceProp}
        >
          {`${batteryLevel}%`}
        </Text>
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
  deviceProp: {
    color: 'lightgreen',
    padding: 20,
  },
  deviceState: {
    color: 'white',
  },
});

export default DeviceList;
