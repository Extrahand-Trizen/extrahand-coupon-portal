/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_COUPON_SERVICE_URL: string;
  readonly VITE_TASK_SERVICE_URL: string;
  readonly VITE_PAYMENT_SERVICE_URL: string;
  readonly VITE_SERVICE_AUTH_TOKEN: string;
  readonly VITE_API_DIRECT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
