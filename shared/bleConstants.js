// Warning: edit the source in /shared, not in /{app,capture}/src/shared
// and use `npm run sync`

export const service = {
  battery: {
    name: 'Battery Service',
    uuid: '0000180f-0000-1000-8000-00805f9b34fb',
  },
};

export const characteristic = {
  batteryLevel: {
    name: 'Battery Level',
    uuid: '00002a19-0000-1000-8000-00805f9b34fb',
  },
};

export const nameFromUuid = {
  ...(Object.fromEntries(Object.values(service).map((s) => [s.uuid, s.name]))),
  ...(Object.fromEntries(Object.values(characteristic).map((c) => [c.uuid, c.name]))),
};