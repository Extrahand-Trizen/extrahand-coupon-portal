/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_COUPON_SERVICE_URL: string;
  readonly VITE_PAYMENT_SERVICE_URL: string;
  readonly VITE_SERVICE_AUTH_TOKEN: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
