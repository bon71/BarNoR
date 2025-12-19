import {device} from 'detox';

beforeAll(async () => {
  await device.launchApp({
    permissions: {camera: 'YES'},
  });
});

beforeEach(async () => {
  await device.reloadReactNative();
});
