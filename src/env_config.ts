export const ENV_CONFIG = {
  AUTOMATE_INITIALIZATION: import.meta.env.VITE_AUTOMATE_INITIALIZATION === "true",
  NCW_SDK_ENV: import.meta.env.VITE_NCW_SDK_ENV ?? "sandbox",
  BACKEND_BASE_URL: import.meta.env.VITE_BACKEND_BASE_URL,
  DEV_MODE: import.meta.env.DEV,
  CLOUDKIT_APITOKEN: import.meta.env.VITE_CLOUDKIT_APITOKEN,
  CLOUDKIT_CONTAINER_ID: import.meta.env.VITE_CLOUDKIT_CONTAINER_ID,
  CLOUDKIT_ENV: import.meta.env.VITE_CLOUDKIT_ENV,
  AUTH_CLIENT_ID: import.meta.env.AUTH_CLIENT_ID,
};
