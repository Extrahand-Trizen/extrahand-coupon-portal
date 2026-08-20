/**
 * Catalog content API helper for coupon-portal.
 * In DEV, Vite proxies `/api/v1/catalog` to task-service and injects auth headers.
 */

const useDevProxy = import.meta.env.DEV && !import.meta.env.VITE_API_DIRECT;
const catalogBaseUrl = useDevProxy
  ? ''
  : (import.meta.env.VITE_TASK_SERVICE_URL || 'http://localhost:4002').replace(/\/$/, '');
const serviceToken = useDevProxy ? '' : import.meta.env.VITE_SERVICE_AUTH_TOKEN || '';
const portalUserId = import.meta.env.VITE_ADMIN_USER_ID || 'coupon-portal';

export async function catalogApi<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Service-Name': 'coupon-portal',
    'X-User-Id': portalUserId,
    ...(init?.headers as Record<string, string> | undefined),
  };
  if (serviceToken) {
    headers['X-Service-Auth'] = serviceToken;
  }

  const res = await fetch(`${catalogBaseUrl}${path}`, {
    ...init,
    headers,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      (data as { message?: string; error?: string })?.message ||
        (data as { error?: string })?.error ||
        `Request failed (${res.status})`,
    );
  }
  return data as T;
}
