import { PermissionsAndroid } from 'react-native';

import * as assert from '../lib/assert';
import { before } from '../lib/testRunner';

before(async () => {
  console.log('On phone: please allow location permission');
  const permissionResult = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
  );
  assert.strictEqual(permissionResult, PermissionsAndroid.RESULTS.GRANTED);
});
