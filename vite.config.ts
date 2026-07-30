import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Dev proxy injects X-Service-Auth so the browser never needs to send the
 * service token (avoids 401 Missing X-Service-Auth / CORS header issues).
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const couponTarget = (env.VITE_COUPON_SERVICE_URL || 'http://localhost:4015').replace(
    /\/$/,
    ''
  );
  const serviceToken = env.VITE_SERVICE_AUTH_TOKEN || env.SERVICE_AUTH_TOKEN || '';

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api/v1/coupons': {
          target: couponTarget,
          changeOrigin: true,
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              if (serviceToken) {
                proxyReq.setHeader('X-Service-Auth', serviceToken);
                proxyReq.setHeader('X-Service-Name', 'coupon-portal');
              }
            });
          },
        },
        '/api/v1/admin/login': {
          target: couponTarget,
          changeOrigin: true,
        },
      },
    },
  };
});
