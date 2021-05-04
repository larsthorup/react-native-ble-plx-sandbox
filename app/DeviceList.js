import React from 'react';
import type { Node } from 'react';

import { useSelector } from 'react-redux';

import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  View,
} from 'react-native';
import Section from './Section';

const DeviceList: () => Node = () => {
  const powerState = useSelector((state) => state.ble.powerState);
  const deviceSet = useSelector((state) => state.ble.deviceSet);
  const deviceNameList = Object.keys(deviceSet).sort();
  return (
    <SafeAreaView>
      <StatusBar />
      <ScrollView contentInsetAdjustmentBehavior="automatic">
        <View>
          <Section title="BLE Sandbox" />
          <Section title="BLE state">{powerState}</Section>
          <Section title="BLE device list">
            {deviceNameList.join(', ')}
          </Section>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default DeviceList;
