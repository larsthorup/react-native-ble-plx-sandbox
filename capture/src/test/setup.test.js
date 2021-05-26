import { PermissionsAndroid } from 'react-native';
import { expect } from 'chai';

import '../lib/mocha';

before(async () => {
  console.log('On phone: please allow location permission');
  const permissionResult = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
  );
  expect(permissionResult).to.equal(PermissionsAndroid.RESULTS.GRANTED);
});
