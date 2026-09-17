# CapRover — Coupon Portal

Static Vite frontend served by nginx.

## Build-time env vars

Set these in CapRover as **build args** for the app:

| Variable | Example value |
|----------|----------------|
| `VITE_API_DIRECT` | `true` |
| `VITE_COUPON_SERVICE_URL` | `https://extrahand-coupon-service.apps.extrahand.in` |
| `VITE_TASK_SERVICE_URL` | `https://extrahand-task-service.apps.extrahand.in` |
| `VITE_PAYMENT_SERVICE_URL` | `https://extrahand-payment-service.apps.extrahand.in` |
| `VITE_SERVICE_AUTH_TOKEN` | same shared service token as `extrahand-coupon-service` (`X7fK9qP2Lm8VtR4zWc1YhN6DsB3aU5Jx` in the current deployment) |
| `VITE_ADMIN_USER_ID` | `coupon-portal` |

## Important

- This app uses Vite env vars at **build time**, not runtime.
- After changing any `VITE_*` value in CapRover, rebuild/redeploy the app.
- The portal image has a development-safe default token so a deployment that omits the build arg does not produce a browser bundle with a missing `X-Service-Auth` header. Set the CapRover build arg explicitly when rotating the backend token, then rebuild.
- Production should use `VITE_API_DIRECT=true` because the Vite dev proxy is only for local development.

## Backend requirements

- `extrahand-coupon-service` must allow the portal origin in `CORS_ORIGIN`.
- `SERVICE_AUTH_TOKEN` must match between the portal build args and backend services.
