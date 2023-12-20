export const ENV_CONFIG = {
  AUTOMATE_INITIALIZATION: import.meta.env.VITE_AUTOMATE_INITIALIZATION === "true",
  NCW_SDK_ENV: import.meta.env.VITE_NCW_SDK_ENV ?? 'sandbox',
  BACKEND_BASE_URL: import.meta.env.VITE_BACKEND_BASE_URL,
  DEV_MODE: import.meta.env.dev,
};
