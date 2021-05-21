# react-native-ble-plx-sandbox

[![Build Status](https://travis-ci.com/larsthorup/react-native-ble-plx-sandbox.svg?branch=main)](https://travis-ci.com/larsthorup/react-native-ble-plx-sandbox)

Prerequisites:

- Setup your environment: https://reactnative.dev/docs/environment-setup
- Use bash

```bash
npm install
npm test
```

## Debug in simulator or phone

Plug in phone, or else simulator will be used.

Terminal 1:

```bash
npm start
```

Terminal 2:

```bash
npm run android
```

## Deploy app on phone

TBD

```
npm run android:log
```

## Create capture app project

- add permissions in android/app/src/main/AndroidManifest.xml
- configure package name in .env
