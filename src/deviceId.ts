const DEVICE_ID_KEY = "DEMO_APP:deviceId";

export const generateDeviceId = () => crypto.randomUUID();

export const loadDeviceId = () => {
  return localStorage.getItem(DEVICE_ID_KEY);
};

export const getOrCreateDeviceId = () => {
  const deviceId = loadDeviceId();
  if (deviceId) {
    return deviceId;
  }

  const uuid = generateDeviceId();
  storeDeviceId(uuid);
  return uuid;
};

export const storeDeviceId = (deviceId: string) => {
  localStorage.setItem(DEVICE_ID_KEY, deviceId);
};
