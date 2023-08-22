export const ENV_CONFIG = {
  AUTOMATE_INITIALIZATION: import.meta.env.VITE_AUTOMATE_INITIALIZATION === "true",
  NCW_SDK_ENV: import.meta.env.VITE_NCW_SDK_ENV ?? 'sandbox',
  AUTH0_DOMAIN: import.meta.env.VITE_AUTH0_DOMAIN,
  AUTH0_CLIENT_ID: import.meta.env.VITE_AUTH0_CLIENT_ID,
  AUTH0_AUDIENCE: import.meta.env.VITE_AUTH0_AUDIENCE,
  BACKEND_BASE_URL: import.meta.env.VITE_BACKEND_BASE_URL,
};
