import { FormEvent, useEffect, useMemo, useState } from 'react';
import { CategorySlugSelect } from './components/CategorySlugSelect';
import { SkuContentPanel } from './components/SkuContentPanel';
import { HelpSupportPanel } from './components/HelpSupportPanel';
import { CategoryContentPanel } from './components/CategoryContentPanel';
import { CategoryManagementPanel } from './components/CategoryManagementPanel';
import { PaginationControls } from './components/PaginationControls';
import { flowsFromServiceIds, labelForSlug } from './data/categorySlugs';

type View = 'landing' | 'login' | 'admin';
type AdminTab = 'coupons' | 'categories' | 'sku-content' | 'help-support' | 'category-content';

type AdminUser = {
  username: string;
  email?: string | null;
  role?: string;
};

type Coupon = {
  _id: string;
  code: string;
  discountType: 'FIXED' | 'PERCENTAGE';
  discountValue: number;
  minOrderAmount: number;
  applicableTo: 'ALL_SERVICES' | 'SELECTED_SERVICES';
  serviceIds: string[];
  applicableFlows: Array<'BOOK_NOW' | 'POST_COMPARE'>;
  redemptionScope: 'PER_USER' | 'GLOBAL_SINGLE_USE';
  firstBookingOnly: boolean;
  usageLimitPerUser: number;
  startDate: string;
  expiryDate: string | null;
  isActive: boolean;
};

type FormState = {
  code: string;
  discountType: 'FIXED' | 'PERCENTAGE';
  discountValue: string;
  minOrderAmount: string;
  applicableTo: 'ALL_SERVICES' | 'SELECTED_SERVICES';
  serviceIds: string[];
  flowBookNow: boolean;
  flowPostCompare: boolean;
  redemptionScope: 'PER_USER' | 'GLOBAL_SINGLE_USE';
  firstBookingOnly: boolean;
  usageLimitPerUser: string;
  startDate: string;
  expiryDate: string;
  isActive: boolean;
};

type BulkFormState = {
  codesText: string;
  discountType: 'FIXED' | 'PERCENTAGE';
  discountValue: string;
  minOrderAmount: string;
  applicableTo: 'ALL_SERVICES' | 'SELECTED_SERVICES';
  serviceIds: string[];
  flowBookNow: boolean;
  flowPostCompare: boolean;
  firstBookingOnly: boolean;
  startDate: string;
  expiryDate: string;
  isActive: boolean;
};

const emptyForm: FormState = {
  code: '',
  discountType: 'FIXED',
  discountValue: '100',
  minOrderAmount: '499',
  applicableTo: 'ALL_SERVICES',
  serviceIds: [],
  flowBookNow: true,
  flowPostCompare: true,
  redemptionScope: 'PER_USER',
  firstBookingOnly: false,
  usageLimitPerUser: '1',
  startDate: new Date().toISOString().slice(0, 10),
  expiryDate: '',
  isActive: true,
};

const emptyBulkForm: BulkFormState = {
  codesText: '',
  discountType: 'FIXED',
  discountValue: '100',
  minOrderAmount: '499',
  applicableTo: 'ALL_SERVICES',
  serviceIds: [],
  flowBookNow: true,
  flowPostCompare: true,
  firstBookingOnly: false,
  startDate: new Date().toISOString().slice(0, 10),
  expiryDate: '',
  isActive: true,
};

const SESSION_KEY = 'eh_coupon_admin_session';

/**
 * In development, call same-origin `/api/...` so Vite can proxy and inject
 * X-Service-Auth. Override with VITE_COUPON_SERVICE_URL only if you must hit
 * the service directly (and send the token yourself).
 */
const useDevProxy = import.meta.env.DEV && !import.meta.env.VITE_API_DIRECT;
const couponBaseUrl = useDevProxy
  ? ''
  : (import.meta.env.VITE_COUPON_SERVICE_URL || 'http://localhost:4015').replace(/\/$/, '');
const serviceToken = useDevProxy ? '' : import.meta.env.VITE_SERVICE_AUTH_TOKEN || '';

function parseBulkCodes(raw: string): string[] {
  return [...new Set(
    raw
      .split(/[\s,;]+/)
      .map((code) => code.trim().toUpperCase())
      .filter(Boolean)
  )];
}

function buildCouponPayload(
  form: Pick<
    FormState,
    | 'discountType'
    | 'discountValue'
    | 'minOrderAmount'
    | 'applicableTo'
    | 'serviceIds'
    | 'flowBookNow'
    | 'flowPostCompare'
    | 'redemptionScope'
    | 'firstBookingOnly'
    | 'usageLimitPerUser'
    | 'startDate'
    | 'expiryDate'
    | 'isActive'
  >,
  formErrorSetter: (message: string) => void,
): Record<string, unknown> | null {
  const flowsLockedToCategories = form.applicableTo === 'SELECTED_SERVICES';
  const derivedFlows = flowsFromServiceIds(form.serviceIds);
  const flowBookNow = flowsLockedToCategories ? derivedFlows.flowBookNow : form.flowBookNow;
  const flowPostCompare = flowsLockedToCategories
    ? derivedFlows.flowPostCompare
    : form.flowPostCompare;

  const applicableFlows: Array<'BOOK_NOW' | 'POST_COMPARE'> = [];
  if (flowBookNow) applicableFlows.push('BOOK_NOW');
  if (flowPostCompare) applicableFlows.push('POST_COMPARE');
  if (!applicableFlows.length) {
    formErrorSetter(
      flowsLockedToCategories
        ? 'Select at least one Book Now service or Post & Compare category'
        : 'Select at least one applicable flow',
    );
    return null;
  }
  if (form.applicableTo === 'SELECTED_SERVICES' && form.serviceIds.length === 0) {
    formErrorSetter('Select at least one category or service');
    return null;
  }

  return {
    discountType: form.discountType,
    discountValue: Number(form.discountValue),
    minOrderAmount: Number(form.minOrderAmount),
    applicableTo: form.applicableTo,
    serviceIds: form.applicableTo === 'SELECTED_SERVICES' ? form.serviceIds : [],
    applicableFlows,
    redemptionScope: form.redemptionScope,
    firstBookingOnly: form.firstBookingOnly,
    usageLimitPerUser:
      form.redemptionScope === 'GLOBAL_SINGLE_USE'
        ? 1
        : Number(form.usageLimitPerUser) || 1,
    startDate: form.startDate ? new Date(form.startDate).toISOString() : new Date().toISOString(),
    expiryDate: form.expiryDate ? new Date(form.expiryDate).toISOString() : null,
    isActive: form.isActive,
  };
}

function readSession(): AdminUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { user?: AdminUser; at?: number };
    if (!parsed?.user?.username) return null;
    // Session expires after 12 hours
    if (parsed.at && Date.now() - parsed.at > 12 * 60 * 60 * 1000) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return parsed.user;
  } catch {
    return null;
  }
}

function saveSession(user: AdminUser) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ user, at: Date.now() }));
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

async function couponApi<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Service-Name': 'coupon-portal',
    ...(init?.headers as Record<string, string> | undefined),
  };
  // Only attach token for direct (non-proxy) calls
  if (serviceToken) {
    headers['X-Service-Auth'] = serviceToken;
  }

  const res = await fetch(`${couponBaseUrl}${path}`, {
    ...init,
    headers,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || data?.error || `Request failed (${res.status})`);
  }
  return data as T;
}

function LandingPage({ onAdminLogin }: { onAdminLogin: () => void }) {
  return (
    <div className="landing">
      <div className="landing-atmosphere" aria-hidden="true" />

      <header className="landing-top">
        <div className="nav-brand">
          <img className="nav-logo" src="/logo.png" alt="" width={36} height={36} />
          <span>ExtraHand</span>
        </div>
        <button className="admin-ghost" type="button" onClick={onAdminLogin}>
          Admin
        </button>
      </header>

      <section className="hero">
        <div className="hero-copy animate-in">
          <div className="brand-hero">
            <img className="brand-logo" src="/logo.png" alt="ExtraHand" width={88} height={88} />
            <p className="brand-lockup">ExtraHand</p>
          </div>
          <h1 className="animate-in animate-delay-1">Coupons for every booking</h1>
          <p className="hero-sub animate-in animate-delay-2">
            Create and manage ExtraHand coupon codes from this portal — for Book Now and Post
            &amp; Compare checkouts.
          </p>
          <div className="hero-cta animate-in animate-delay-3">
            <button className="btn btn-primary btn-lg" type="button" onClick={onAdminLogin}>
              Admin login
            </button>
          </div>
        </div>

        <aside className="how hero-how animate-in animate-delay-2">
          <h2>How it works</h2>
          <ol className="how-list">
            <li>
              <span>01</span>
              <p>Sign in with your corporate admin account to open coupon management.</p>
            </li>
            <li>
              <span>02</span>
              <p>Create or edit coupons — discount, min order, flows, and validity.</p>
            </li>
            <li>
              <span>03</span>
              <p>Activate the code so customers can apply it at checkout in the app.</p>
            </li>
          </ol>
        </aside>
      </section>

      <footer className="landing-footer">
        <span>© {new Date().getFullYear()} ExtraHand</span>
      </footer>
    </div>
  );
}

function LoginPage({
  onBack,
  onSuccess,
}: {
  onBack: () => void;
  onSuccess: (user: AdminUser) => void;
}) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${couponBaseUrl}/api/v1/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success || !data?.user?.username) {
        throw new Error(data?.error || data?.message || 'Invalid credentials');
      }
      const user: AdminUser = {
        username: String(data.user.username),
        email: data.user.email ?? null,
        role: data.user.role,
      };
      saveSession(user);
      onSuccess(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="landing-atmosphere" aria-hidden="true" />

      <header className="login-top">
        <button className="back-link" type="button" onClick={onBack}>
          ← Home
        </button>
      </header>

      <main className="login-main">
        <div className="login-brand animate-in">
          <img className="login-logo" src="/logo.png" alt="ExtraHand" width={72} height={72} />
          <p className="brand-lockup brand-lockup-sm">ExtraHand</p>
        </div>

        <h1 className="animate-in animate-delay-1">Admin login</h1>
        <p className="login-sub animate-in animate-delay-1">
          Use your corporate admin credentials.
        </p>

        <form onSubmit={onSubmit} className="login-form animate-in animate-delay-2">
          <label>
            Username
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              placeholder="admin"
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="••••••••"
              required
            />
          </label>
          {error ? <p className="error">{error}</p> : null}
          <button className="btn btn-primary btn-lg" type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </main>
    </div>
  );
}

function AdminDashboard({
  admin,
  onLogout,
}: {
  admin: AdminUser;
  onLogout: () => void;
}) {
  const [adminTab, setAdminTab] = useState<AdminTab>('coupons');
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [bulkForm, setBulkForm] = useState<BulkFormState>(emptyBulkForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [bulkResult, setBulkResult] = useState<null | {
    createdCount: number;
    skippedCount: number;
    createdCodes: string[];
    skippedCodes: string[];
  }>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [listQuery, setListQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [flowFilter, setFlowFilter] = useState<'all' | 'BOOK_NOW' | 'POST_COMPARE'>('all');
  const [couponPage, setCouponPage] = useState(1);
  const [couponPageSize, setCouponPageSize] = useState(10);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await couponApi<{ coupons: Coupon[] }>('/api/v1/coupons/admin/coupons');
      setCoupons(data.coupons || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load coupons');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filteredCoupons = useMemo(() => {
    const q = listQuery.trim().toLowerCase();
    return coupons.filter((c) => {
      if (statusFilter === 'active' && !c.isActive) return false;
      if (statusFilter === 'inactive' && c.isActive) return false;
      if (flowFilter !== 'all' && !(c.applicableFlows || []).includes(flowFilter)) return false;
      if (!q) return true;
      const hay = [
        c.code,
        c.applicableTo,
        ...(c.serviceIds || []),
        ...(c.applicableFlows || []),
        ...(c.serviceIds || []).map(labelForSlug),
      ]
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [coupons, listQuery, statusFilter, flowFilter]);

  useEffect(() => {
    setCouponPage(1);
  }, [listQuery, statusFilter, flowFilter]);

  const pagedCoupons = useMemo(() => {
    const start = (couponPage - 1) * couponPageSize;
    return filteredCoupons.slice(start, start + couponPageSize);
  }, [couponPage, couponPageSize, filteredCoupons]);

  const closeForm = () => {
    setFormOpen(false);
    setForm(emptyForm);
    setEditingId(null);
    setFormError(null);
  };

  const closeBulk = () => {
    setBulkOpen(false);
    setBulkForm(emptyBulkForm);
    setBulkError(null);
    setBulkResult(null);
  };

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setFormError(null);
    setFormOpen(true);
  };

  const openBulk = () => {
    setBulkForm(emptyBulkForm);
    setBulkError(null);
    setBulkResult(null);
    setBulkOpen(true);
  };

  const onBulkFileChange = async (file: File | null) => {
    if (!file) return;
    try {
      const text = await file.text();
      setBulkForm((prev) => ({
        ...prev,
        codesText: [prev.codesText.trim(), text.trim()].filter(Boolean).join('\n'),
      }));
      setBulkError(null);
    } catch {
      setBulkError('Unable to read the uploaded file.');
    }
  };

  const startEdit = (c: Coupon) => {
    setEditingId(c._id);
    setForm({
      code: c.code,
      discountType: c.discountType,
      discountValue: String(c.discountValue),
      minOrderAmount: String(c.minOrderAmount),
      applicableTo: c.applicableTo,
      serviceIds: [...(c.serviceIds || [])],
      flowBookNow: c.applicableFlows.includes('BOOK_NOW'),
      flowPostCompare: c.applicableFlows.includes('POST_COMPARE'),
      redemptionScope: c.redemptionScope || 'PER_USER',
      firstBookingOnly: c.firstBookingOnly,
      usageLimitPerUser: String(c.usageLimitPerUser),
      startDate: c.startDate ? c.startDate.slice(0, 10) : '',
      expiryDate: c.expiryDate ? c.expiryDate.slice(0, 10) : '',
      isActive: c.isActive,
    });
    setFormError(null);
    setFormOpen(true);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const sharedPayload = buildCouponPayload(form, setFormError);
    if (!sharedPayload) return;
    const payload = {
      code: form.code.trim().toUpperCase(),
      ...sharedPayload,
    };

    setSaving(true);
    try {
      if (editingId) {
        await couponApi(`/api/v1/coupons/admin/coupons/${editingId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      } else {
        await couponApi('/api/v1/coupons/admin/coupons', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      closeForm();
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const onBulkSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBulkError(null);
    setBulkResult(null);

    const codes = parseBulkCodes(bulkForm.codesText);
    if (codes.length === 0) {
      setBulkError('Paste or upload at least one coupon code.');
      return;
    }

    const sharedPayload = buildCouponPayload(
      {
        ...bulkForm,
        redemptionScope: 'GLOBAL_SINGLE_USE',
        usageLimitPerUser: '1',
      },
      setBulkError,
    );
    if (!sharedPayload) return;

    setSaving(true);
    try {
      const result = await couponApi<{
        createdCount: number;
        skippedCount: number;
        createdCodes: string[];
        skippedCodes: string[];
      }>('/api/v1/coupons/admin/coupons/bulk', {
        method: 'POST',
        body: JSON.stringify({
          codes,
          ...sharedPayload,
        }),
      });
      setBulkResult(result);
      await load();
    } catch (err) {
      setBulkError(err instanceof Error ? err.message : 'Bulk upload failed');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (c: Coupon) => {
    try {
      await couponApi(`/api/v1/coupons/admin/coupons/${c._id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !c.isActive }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Status update failed');
    }
  };

  const deleteCoupon = async (c: Coupon) => {
    const ok = window.confirm(
      `Delete coupon ${c.code}? This cannot be undone.`,
    );
    if (!ok) return;
    try {
      await couponApi(`/api/v1/coupons/admin/coupons/${c._id}`, {
        method: 'DELETE',
      });
      if (editingId === c._id) closeForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const activeCount = useMemo(
    () => coupons.filter((c) => c.isActive).length,
    [coupons],
  );

  const inactiveCount = coupons.length - activeCount;

  return (
    <div className="mgmt">
      <header className="mgmt-header">
        <div className="mgmt-brand">
          <img src="/logo.png" alt="" width={40} height={40} />
          <div>
            <strong>ExtraHand Coupons</strong>
            <span>Signed in as {admin.username}</span>
          </div>
        </div>
        <button
          className="btn btn-ghost btn-sm"
          type="button"
          onClick={() => {
            clearSession();
            onLogout();
          }}
        >
          Logout
        </button>
      </header>

      <nav className="mgmt-tabs" aria-label="Admin sections">
        {(
          [
            ['coupons', 'Coupons'],
            ['categories', 'Categories'],
            ['category-content', 'Services'],
            ['sku-content', 'Packages / SKUs'],
            ['help-support', 'Help & Support'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`mgmt-tab ${adminTab === id ? 'mgmt-tab-active' : ''}`}
            onClick={() => setAdminTab(id)}
          >
            {label}
          </button>
        ))}
      </nav>

      <main className="mgmt-body">
        {adminTab === 'sku-content' ? <SkuContentPanel /> : null}
        {adminTab === 'categories' ? <CategoryManagementPanel /> : null}
        {adminTab === 'category-content' ? <CategoryContentPanel /> : null}
        {adminTab === 'help-support' ? <HelpSupportPanel /> : null}
        {adminTab === 'coupons' ? (
          <>
        <div className="mgmt-page-head">
          <div>
            <h1 className="mgmt-title">Coupons</h1>
            <p className="mgmt-subtitle muted">
              Manage discount codes for Book Now and Post &amp; Compare checkouts.
            </p>
          </div>
          <div className="action-group">
            <button className="btn btn-secondary" type="button" onClick={openBulk}>
              Bulk upload
            </button>
            <button className="btn btn-primary" type="button" onClick={openCreate}>
              Create coupon
            </button>
          </div>
        </div>

        <div className="mgmt-stats">
          <div className="mgmt-stat">
            <span className="mgmt-stat-value">{coupons.length}</span>
            <span className="mgmt-stat-label">Total</span>
          </div>
          <div className="mgmt-stat mgmt-stat-ok">
            <span className="mgmt-stat-value">{activeCount}</span>
            <span className="mgmt-stat-label">Active</span>
          </div>
          <div className="mgmt-stat mgmt-stat-muted">
            <span className="mgmt-stat-value">{inactiveCount}</span>
            <span className="mgmt-stat-label">Inactive</span>
          </div>
          <div className="mgmt-stat">
            <span className="mgmt-stat-value">{filteredCoupons.length}</span>
            <span className="mgmt-stat-label">Showing</span>
          </div>
        </div>

        <div className="mgmt-toolbar">
          <input
            className="mgmt-search"
            value={listQuery}
            onChange={(e) => setListQuery(e.target.value)}
            placeholder="Search code, service, or category..."
          />
          <select
            className="mgmt-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          >
            <option value="all">All status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <select
            className="mgmt-filter"
            value={flowFilter}
            onChange={(e) => setFlowFilter(e.target.value as typeof flowFilter)}
          >
            <option value="all">All flows</option>
            <option value="BOOK_NOW">Book Now</option>
            <option value="POST_COMPARE">Post &amp; Compare</option>
          </select>
          <button
            className="btn btn-ghost btn-sm mgmt-refresh"
            type="button"
            onClick={() => void load()}
            disabled={loading}
          >
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>

        {error ? <p className="error mgmt-error">{error}</p> : null}

        <div className="mgmt-table-wrap">
          <table className="mgmt-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Discount</th>
                <th>Min order</th>
                <th>Scope</th>
                <th>Flows</th>
                <th>Status</th>
                <th className="th-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
                    {loading && coupons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="mgmt-empty">
                    Loading coupons…
                  </td>
                </tr>
              ) : filteredCoupons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="mgmt-empty">
                    <p>No coupons match your filters.</p>
                    <button className="btn btn-primary btn-sm" type="button" onClick={openCreate}>
                      Create coupon
                    </button>
                  </td>
                </tr>
              ) : (
                pagedCoupons.map((c) => (
                  <tr key={c._id}>
                    <td>
                      <div className="td-code">
                        <span className="code-pill">{c.code}</span>
                        {c.redemptionScope === 'GLOBAL_SINGLE_USE' ? (
                          <span className="meta-tag">Global single use</span>
                        ) : null}
                        {c.firstBookingOnly ? (
                          <span className="meta-tag">First booking</span>
                        ) : null}
                      </div>
                    </td>
                    <td>
                      <span className="discount-cell">
                        {c.discountType === 'FIXED' ? `₹${c.discountValue}` : `${c.discountValue}%`}
                      </span>
                    </td>
                    <td className="td-muted">₹{c.minOrderAmount}</td>
                    <td className="cats-cell">
                      {c.applicableTo === 'ALL_SERVICES' ? (
                        <span className="cat-chip">Everything</span>
                      ) : (
                        <div className="cat-chips">
                          {(c.serviceIds || []).slice(0, 2).map((slug) => (
                            <span key={slug} className="cat-chip">
                              {labelForSlug(slug)}
                            </span>
                          ))}
                          {(c.serviceIds || []).length > 2 ? (
                            <span className="cat-chip cat-chip-more">
                              +{(c.serviceIds || []).length - 2} more
                            </span>
                          ) : null}
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="flow-chips">
                        {(c.applicableFlows || []).map((f) => (
                          <span key={f} className="flow-chip">
                            {f === 'BOOK_NOW' ? 'Book Now' : 'Post & Compare'}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${c.isActive ? 'badge-on' : 'badge-off'}`}>
                        {c.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="actions-cell">
                      <div className="action-group">
                        <button
                          className="btn btn-ghost btn-sm"
                          type="button"
                          onClick={() => startEdit(c)}
                        >
                          Edit
                        </button>
                        <button
                          className={`btn btn-sm ${c.isActive ? 'btn-ghost' : 'btn-success'}`}
                          type="button"
                          onClick={() => void toggleStatus(c)}
                        >
                          {c.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          type="button"
                          onClick={() => void deleteCoupon(c)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <PaginationControls
          page={couponPage}
          pageSize={couponPageSize}
          totalItems={filteredCoupons.length}
          onPageChange={setCouponPage}
          onPageSizeChange={(size) => {
            setCouponPageSize(size);
            setCouponPage(1);
          }}
        />
          </>
        ) : null}
      </main>

      {adminTab === 'coupons' && formOpen ? (
        <div className="modal-backdrop" onClick={closeForm} role="presentation">
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="coupon-form-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-head">
              <h2 id="coupon-form-title">{editingId ? 'Edit coupon' : 'Create coupon'}</h2>
              <button className="btn btn-ghost btn-sm" type="button" onClick={closeForm}>
                Close
              </button>
            </div>

            <form className="coupon-form" onSubmit={onSubmit}>
              <div className="form-grid">
                <label>
                  Code
                  <input
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    required
                    disabled={!!editingId}
                    placeholder="FIRST100"
                  />
                </label>
                <label>
                  Discount type
                  <select
                    value={form.discountType}
                    onChange={(e) =>
                      setForm({ ...form, discountType: e.target.value as FormState['discountType'] })
                    }
                  >
                    <option value="FIXED">Fixed (₹)</option>
                    <option value="PERCENTAGE">Percentage (%)</option>
                  </select>
                </label>
                <label>
                  Discount value
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.discountValue}
                    onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                    required
                  />
                </label>
                <label>
                  Minimum order amount
                  <input
                    type="number"
                    min="0"
                    value={form.minOrderAmount}
                    onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })}
                  />
                </label>
                <label>
                  Applicable to
                  <select
                    value={form.applicableTo}
                    onChange={(e) => {
                      const applicableTo = e.target.value as FormState['applicableTo'];
                      if (applicableTo === 'ALL_SERVICES') {
                        setForm({
                          ...form,
                          applicableTo,
                          serviceIds: [],
                        });
                        return;
                      }
                      const derived = flowsFromServiceIds(form.serviceIds);
                      setForm({
                        ...form,
                        applicableTo,
                        flowBookNow: derived.flowBookNow,
                        flowPostCompare: derived.flowPostCompare,
                      });
                    }}
                  >
                    <option value="ALL_SERVICES">Everything</option>
                    <option value="SELECTED_SERVICES">Selected services and categories</option>
                  </select>
                </label>
                <label>
                  Redemption mode
                  <select
                    value={form.redemptionScope}
                    onChange={(e) => {
                      const redemptionScope = e.target.value as FormState['redemptionScope'];
                      setForm({
                        ...form,
                        redemptionScope,
                        usageLimitPerUser:
                          redemptionScope === 'GLOBAL_SINGLE_USE' ? '1' : form.usageLimitPerUser,
                      });
                    }}
                  >
                    <option value="PER_USER">Per user</option>
                    <option value="GLOBAL_SINGLE_USE">Global single use</option>
                  </select>
                </label>
                <label>
                  Usage limit per user
                  <input
                    type="number"
                    min="1"
                    value={form.usageLimitPerUser}
                    onChange={(e) => setForm({ ...form, usageLimitPerUser: e.target.value })}
                    disabled={form.redemptionScope === 'GLOBAL_SINGLE_USE'}
                  />
                </label>
                <label>
                  Start date
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  />
                </label>
                <label>
                  Expiry date (optional)
                  <input
                    type="date"
                    value={form.expiryDate}
                    onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                  />
                </label>
              </div>

              <label className="full-width-field">
                Categories and Book Now services
                <CategorySlugSelect
                  value={form.serviceIds}
                  onChange={(serviceIds) => {
                    if (form.applicableTo === 'SELECTED_SERVICES') {
                      const derived = flowsFromServiceIds(serviceIds);
                      setForm({
                        ...form,
                        serviceIds,
                        flowBookNow: derived.flowBookNow,
                        flowPostCompare: derived.flowPostCompare,
                      });
                      return;
                    }
                    setForm({ ...form, serviceIds });
                  }}
                  disabled={form.applicableTo !== 'SELECTED_SERVICES'}
                />
              </label>

              <div className="check-row">
                <label
                  className={`check-item ${
                    form.applicableTo === 'SELECTED_SERVICES' ? 'is-disabled' : ''
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={
                      form.applicableTo === 'SELECTED_SERVICES'
                        ? flowsFromServiceIds(form.serviceIds).flowBookNow
                        : form.flowBookNow
                    }
                    disabled={form.applicableTo === 'SELECTED_SERVICES'}
                    onChange={(e) => setForm({ ...form, flowBookNow: e.target.checked })}
                  />
                  Book Now
                </label>
                <label
                  className={`check-item ${
                    form.applicableTo === 'SELECTED_SERVICES' ? 'is-disabled' : ''
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={
                      form.applicableTo === 'SELECTED_SERVICES'
                        ? flowsFromServiceIds(form.serviceIds).flowPostCompare
                        : form.flowPostCompare
                    }
                    disabled={form.applicableTo === 'SELECTED_SERVICES'}
                    onChange={(e) => setForm({ ...form, flowPostCompare: e.target.checked })}
                  />
                  Post &amp; Compare
                </label>
                <label className="check-item">
                  <input
                    type="checkbox"
                    checked={form.firstBookingOnly}
                    onChange={(e) => setForm({ ...form, firstBookingOnly: e.target.checked })}
                  />
                  First booking only
                </label>
                <label className="check-item">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  />
                  Active
                </label>
              </div>

              {formError ? <p className="error">{formError}</p> : null}

              <div className="form-actions">
                <button className="btn btn-primary" type="submit" disabled={saving}>
                  {saving ? 'Saving…' : editingId ? 'Save changes' : 'Create coupon'}
                </button>
                <button className="btn btn-ghost" type="button" onClick={closeForm}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {adminTab === 'coupons' && bulkOpen ? (
        <div className="modal-backdrop" onClick={closeBulk} role="presentation">
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="coupon-bulk-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-head">
              <h2 id="coupon-bulk-title">Bulk upload global single-use coupons</h2>
              <button className="btn btn-ghost btn-sm" type="button" onClick={closeBulk}>
                Close
              </button>
            </div>

            <form className="coupon-form" onSubmit={onBulkSubmit}>
              <p className="muted bulk-help">
                Paste coupon codes or upload a `.txt` / `.csv` file. These coupons are created as
                global single-use codes and stay hidden from auto-suggested customer lists.
              </p>

              <label className="full-width-field">
                Coupon codes
                <textarea
                  rows={8}
                  value={bulkForm.codesText}
                  onChange={(e) => setBulkForm({ ...bulkForm, codesText: e.target.value.toUpperCase() })}
                  placeholder={'TARUN100\nTARUN101\nTARUN102'}
                />
              </label>

              <label className="full-width-field">
                Upload file
                <input
                  type="file"
                  accept=".txt,.csv,text/plain,text/csv"
                  onChange={(e) => void onBulkFileChange(e.target.files?.[0] || null)}
                />
              </label>

              <div className="form-grid">
                <label>
                  Discount type
                  <select
                    value={bulkForm.discountType}
                    onChange={(e) =>
                      setBulkForm({
                        ...bulkForm,
                        discountType: e.target.value as BulkFormState['discountType'],
                      })
                    }
                  >
                    <option value="FIXED">Fixed (₹)</option>
                    <option value="PERCENTAGE">Percentage (%)</option>
                  </select>
                </label>
                <label>
                  Discount value
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={bulkForm.discountValue}
                    onChange={(e) => setBulkForm({ ...bulkForm, discountValue: e.target.value })}
                    required
                  />
                </label>
                <label>
                  Minimum order amount
                  <input
                    type="number"
                    min="0"
                    value={bulkForm.minOrderAmount}
                    onChange={(e) => setBulkForm({ ...bulkForm, minOrderAmount: e.target.value })}
                  />
                </label>
                <label>
                  Applicable to
                  <select
                    value={bulkForm.applicableTo}
                    onChange={(e) => {
                      const applicableTo = e.target.value as BulkFormState['applicableTo'];
                      if (applicableTo === 'ALL_SERVICES') {
                        setBulkForm({
                          ...bulkForm,
                          applicableTo,
                          serviceIds: [],
                        });
                        return;
                      }
                      const derived = flowsFromServiceIds(bulkForm.serviceIds);
                      setBulkForm({
                        ...bulkForm,
                        applicableTo,
                        flowBookNow: derived.flowBookNow,
                        flowPostCompare: derived.flowPostCompare,
                      });
                    }}
                  >
                    <option value="ALL_SERVICES">Everything</option>
                    <option value="SELECTED_SERVICES">Selected services and categories</option>
                  </select>
                </label>
                <label>
                  Start date
                  <input
                    type="date"
                    value={bulkForm.startDate}
                    onChange={(e) => setBulkForm({ ...bulkForm, startDate: e.target.value })}
                  />
                </label>
                <label>
                  Expiry date (optional)
                  <input
                    type="date"
                    value={bulkForm.expiryDate}
                    onChange={(e) => setBulkForm({ ...bulkForm, expiryDate: e.target.value })}
                  />
                </label>
              </div>

              <label className="full-width-field">
                Categories and Book Now services
                <CategorySlugSelect
                  value={bulkForm.serviceIds}
                  onChange={(serviceIds) => {
                    if (bulkForm.applicableTo === 'SELECTED_SERVICES') {
                      const derived = flowsFromServiceIds(serviceIds);
                      setBulkForm({
                        ...bulkForm,
                        serviceIds,
                        flowBookNow: derived.flowBookNow,
                        flowPostCompare: derived.flowPostCompare,
                      });
                      return;
                    }
                    setBulkForm({ ...bulkForm, serviceIds });
                  }}
                  disabled={bulkForm.applicableTo !== 'SELECTED_SERVICES'}
                />
              </label>

              <div className="check-row">
                <label
                  className={`check-item ${
                    bulkForm.applicableTo === 'SELECTED_SERVICES' ? 'is-disabled' : ''
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={
                      bulkForm.applicableTo === 'SELECTED_SERVICES'
                        ? flowsFromServiceIds(bulkForm.serviceIds).flowBookNow
                        : bulkForm.flowBookNow
                    }
                    disabled={bulkForm.applicableTo === 'SELECTED_SERVICES'}
                    onChange={(e) => setBulkForm({ ...bulkForm, flowBookNow: e.target.checked })}
                  />
                  Book Now
                </label>
                <label
                  className={`check-item ${
                    bulkForm.applicableTo === 'SELECTED_SERVICES' ? 'is-disabled' : ''
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={
                      bulkForm.applicableTo === 'SELECTED_SERVICES'
                        ? flowsFromServiceIds(bulkForm.serviceIds).flowPostCompare
                        : bulkForm.flowPostCompare
                    }
                    disabled={bulkForm.applicableTo === 'SELECTED_SERVICES'}
                    onChange={(e) => setBulkForm({ ...bulkForm, flowPostCompare: e.target.checked })}
                  />
                  Post &amp; Compare
                </label>
                <label className="check-item">
                  <input
                    type="checkbox"
                    checked={bulkForm.firstBookingOnly}
                    onChange={(e) => setBulkForm({ ...bulkForm, firstBookingOnly: e.target.checked })}
                  />
                  First booking only
                </label>
                <label className="check-item">
                  <input
                    type="checkbox"
                    checked={bulkForm.isActive}
                    onChange={(e) => setBulkForm({ ...bulkForm, isActive: e.target.checked })}
                  />
                  Active
                </label>
              </div>

              {bulkError ? <p className="error">{bulkError}</p> : null}
              {bulkResult ? (
                <div className="bulk-result">
                  <p className="ok">
                    Created {bulkResult.createdCount} coupons. Skipped {bulkResult.skippedCount}{' '}
                    existing codes.
                  </p>
                  {bulkResult.skippedCodes.length > 0 ? (
                    <p className="muted bulk-skipped">
                      Skipped: {bulkResult.skippedCodes.slice(0, 25).join(', ')}
                      {bulkResult.skippedCodes.length > 25
                        ? ` +${bulkResult.skippedCodes.length - 25} more`
                        : ''}
                    </p>
                  ) : null}
                </div>
              ) : null}

              <div className="form-actions">
                <button className="btn btn-primary" type="submit" disabled={saving}>
                  {saving ? 'Uploading…' : 'Create bulk coupons'}
                </button>
                <button className="btn btn-ghost" type="button" onClick={closeBulk}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function App() {
  const initialSession = useMemo(() => readSession(), []);
  const [view, setView] = useState<View>(initialSession ? 'admin' : 'landing');
  const [admin, setAdmin] = useState<AdminUser | null>(initialSession);

  if (view === 'landing') {
    return <LandingPage onAdminLogin={() => setView('login')} />;
  }

  if (view === 'login' || !admin) {
    return (
      <LoginPage
        onBack={() => setView('landing')}
        onSuccess={(user) => {
          setAdmin(user);
          setView('admin');
        }}
      />
    );
  }

  return (
    <AdminDashboard
      admin={admin}
      onLogout={() => {
        setAdmin(null);
        setView('landing');
      }}
    />
  );
}
