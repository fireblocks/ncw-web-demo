/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AUTOMATE_INITIALIZATION?: string;
  readonly VITE_NCW_SDK_ENV?: string;
  readonly VITE_BACKEND_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
