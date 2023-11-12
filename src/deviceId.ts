const DEVICE_ID_KEY = "DEMO_APP:deviceId";

export const generateDeviceId = () => crypto.randomUUID();

export const loadDeviceId = (userId: string) => {
  return localStorage.getItem(`${DEVICE_ID_KEY}-${userId}`);
};

export const getOrCreateDeviceId = (userId: string) => {
  const deviceId = loadDeviceId(userId);
  if (deviceId) {
    return deviceId;
  }

  const uuid = generateDeviceId();
  storeDeviceId(uuid, userId);
  return uuid;
};

export const storeDeviceId = (deviceId: string, userId: string) => {
  localStorage.setItem(`${DEVICE_ID_KEY}-${userId}`, deviceId);
};
