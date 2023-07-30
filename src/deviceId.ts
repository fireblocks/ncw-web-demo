const DEVICE_ID_KEY = "DEMO_APP:deviceId";

export const generateDeviceId = () => crypto.randomUUID();

export const getDeviceId = () => {
  return localStorage.getItem(DEVICE_ID_KEY);
};

export const getOrCreateDeviceId = () => {
  const deviceId = getDeviceId();
  if (deviceId) {
    return deviceId;
  }

  const uuid = generateDeviceId();
  setDeviceId(uuid);
  return uuid;
};

export const setDeviceId = (deviceId: string) => {
  localStorage.setItem(DEVICE_ID_KEY, deviceId);
};
