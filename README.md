# react-native-ble-plx-sandbox

[![Build Status](https://github.com/larsthorup/react-native-ble-plx-sandbox/actions/workflows/ci.yml/badge.svg)](https://github.com/larsthorup/react-native-ble-plx-sandbox/actions/workflows/ci.yml)

Prerequisites:

- A Bluetooth device support the standard Battery Service
- An Android phone
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

## Create app recorder project

- add permissions in android/app/src/main/AndroidManifest.xml
- configure package name in .env

## Publish packages

```bash
npm test
# git commit && git push
# wait for CI to pass
npm run bump
npm run publish
# git commit && git push
```
