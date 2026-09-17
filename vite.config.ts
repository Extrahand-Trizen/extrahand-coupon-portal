import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Dev proxy injects service headers so the browser never needs to send the
 * service token (avoids 401 auth / CORS header issues).
 *
 * Coupons → coupon-service
 * Catalog content (Book Now / Help Support) → task-service
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const couponTarget = (env.VITE_COUPON_SERVICE_URL || 'http://localhost:4015').replace(
    /\/$/,
    ''
  );
  const taskTarget = (env.VITE_TASK_SERVICE_URL || 'http://localhost:4002').replace(/\/$/, '');
  const serviceToken =
    env.VITE_SERVICE_AUTH_TOKEN ||
    env.VITE_COUPON_SERVICE_AUTH_TOKEN ||
    env.SERVICE_AUTH_TOKEN ||
    '';
  const portalUserId = env.VITE_ADMIN_USER_ID || env.ADMIN_USER_ID || 'coupon-portal';

  const injectServiceAuth = (proxy: {
    on: (event: string, listener: (...args: unknown[]) => void) => void;
  }) => {
    proxy.on('proxyReq', (...args: unknown[]) => {
      const proxyReq = args[0] as { setHeader: (name: string, value: string) => void };
      if (serviceToken) {
        proxyReq.setHeader('X-Service-Auth', serviceToken);
        proxyReq.setHeader('X-Service-Name', 'coupon-portal');
      }
      proxyReq.setHeader('X-User-Id', portalUserId);
    });
  };

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api/v1/coupons': {
          target: couponTarget,
          changeOrigin: true,
          configure: injectServiceAuth,
        },
        '/api/v1/catalog': {
          target: taskTarget,
          changeOrigin: true,
          configure: injectServiceAuth,
        },
        '/api/v1/admin/login': {
          target: couponTarget,
          changeOrigin: true,
        },
      },
    },
  };
});
