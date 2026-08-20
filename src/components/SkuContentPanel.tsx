import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { catalogApi } from '../api/catalogApi';
import { BOOK_NOW_SERVICE_OPTIONS, labelForSlug } from '../data/categorySlugs';
import { PaginationControls } from './PaginationControls';

export type SkuContentRow = {
  _id: string;
  categorySlug: string;
  skuSlug: string;
  displayName: string;
  shortDescription?: string;
  longDescription?: string;
  includes: string[];
  excludes: string[];
  imageUrls: string[];
  faqItems: Array<{ question: string; answer: string }>;
  sortOrder: number;
  isActive: boolean;
};

type OperationalSkuRow = {
  _id: string;
  slug: string;
  name: string;
  categorySlug: string;
  basePrice: number;
  durationMinutes: number;
  pricing?: {
    originalPrice: number;
    offerPrice: number;
    savingsAmount: number;
    isOfferActive: boolean;
    offerDiscountType: 'percent' | 'flat';
    offerDiscountValue: number;
    appliedPercent: number;
  };
};

type ServiceContentRow = {
  categorySlug: string;
  title: string;
  isActive: boolean;
};

type FormState = {
  categorySlug: string;
  skuSlug: string;
  displayName: string;
  shortDescription: string;
  longDescription: string;
  includesText: string;
  excludesText: string;
  sortOrder: string;
  isActive: boolean;
  originalPrice: string;
  offerDiscountType: 'percent' | 'flat';
  offerDiscountValue: string;
  isOfferActive: boolean;
  durationMinutes: string;
};

const emptyForm: FormState = {
  categorySlug: BOOK_NOW_SERVICE_OPTIONS[0]?.slug || 'full-house',
  skuSlug: '',
  displayName: '',
  shortDescription: '',
  longDescription: '',
  includesText: '',
  excludesText: '',
  sortOrder: '0',
  isActive: true,
  originalPrice: '0',
  offerDiscountType: 'percent',
  offerDiscountValue: '0',
  isOfferActive: false,
  durationMinutes: '30',
};

function linesToArray(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

export function SkuContentPanel() {
  const [rows, setRows] = useState<SkuContentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState('');
  const [operationalRows, setOperationalRows] = useState<OperationalSkuRow[]>([]);
  const [serviceRows, setServiceRows] = useState<ServiceContentRow[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const operationalByComposite = useMemo(() => {
    const map = new Map<string, OperationalSkuRow>();
    for (const row of operationalRows) {
      map.set(`${row.categorySlug}::${row.slug}`, row);
    }
    return map;
  }, [operationalRows]);

  const serviceLabelBySlug = useMemo(() => {
    const map = new Map<string, string>();
    for (const opt of BOOK_NOW_SERVICE_OPTIONS) {
      map.set(opt.slug, opt.label);
    }
    for (const row of serviceRows) {
      map.set(row.categorySlug, row.title);
    }
    return map;
  }, [serviceRows]);

  const parentServiceOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const opt of BOOK_NOW_SERVICE_OPTIONS) {
      map.set(opt.slug, opt.label);
    }
    for (const row of serviceRows) {
      if (row.categorySlug) {
        map.set(row.categorySlug, row.title || row.categorySlug);
      }
    }
    for (const row of operationalRows) {
      if (row.categorySlug && !map.has(row.categorySlug)) {
        map.set(row.categorySlug, labelForSlug(row.categorySlug).replace(' (Book Now)', ''));
      }
    }
    for (const row of rows) {
      if (row.categorySlug && !map.has(row.categorySlug)) {
        map.set(row.categorySlug, labelForSlug(row.categorySlug).replace(' (Book Now)', ''));
      }
    }
    return [...map.entries()]
      .map(([slug, label]) => ({ slug, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [operationalRows, rows, serviceRows]);

  const getServiceLabel = useCallback(
    (slug: string) => serviceLabelBySlug.get(slug) || labelForSlug(slug).replace(' (Book Now)', ''),
    [serviceLabelBySlug],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await catalogApi<{ success: boolean; data: SkuContentRow[] }>(
        '/api/v1/catalog/internal/skus/content?includeInactive=true',
      );
      setRows(Array.isArray(data.data) ? data.data : []);
      const operational = await catalogApi<{ success: boolean; data: OperationalSkuRow[] }>(
        '/api/v1/catalog/internal/skus/operational?includeInactive=true',
      );
      setOperationalRows(Array.isArray(operational.data) ? operational.data : []);
      const services = await catalogApi<{ success: boolean; data: ServiceContentRow[] }>(
        '/api/v1/catalog/internal/categories/content?includeInactive=true',
      );
      setServiceRows(Array.isArray(services.data) ? services.data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load packages');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const ordered = [...rows].sort((a, b) => {
      const service = getServiceLabel(a.categorySlug).localeCompare(getServiceLabel(b.categorySlug));
      if (service !== 0) return service;
      return a.displayName.localeCompare(b.displayName);
    });
    if (!q) return ordered;
    return ordered.filter((row) =>
      [row.displayName, row.skuSlug, row.categorySlug, getServiceLabel(row.categorySlug)]
        .join(' ')
        .toLowerCase()
        .includes(q),
    );
  }, [getServiceLabel, rows, query]);

  useEffect(() => {
    setPage(1);
  }, [query]);

  const pagedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const closeForm = () => {
    setFormOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    setFormError(null);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm({
      ...emptyForm,
      categorySlug: parentServiceOptions[0]?.slug || emptyForm.categorySlug,
    });
    setFormError(null);
    setFormOpen(true);
  };

  const startEdit = (row: SkuContentRow) => {
    const operational = operationalByComposite.get(`${row.categorySlug}::${row.skuSlug}`);
    setEditingId(row._id);
    setForm({
      categorySlug: row.categorySlug,
      skuSlug: row.skuSlug,
      displayName: row.displayName,
      shortDescription: row.shortDescription || '',
      longDescription: row.longDescription || '',
      includesText: (row.includes || []).join('\n'),
      excludesText: (row.excludes || []).join('\n'),
      sortOrder: String(row.sortOrder ?? 0),
      isActive: row.isActive,
      originalPrice: String(operational?.basePrice ?? 0),
      offerDiscountType: operational?.pricing?.offerDiscountType || 'percent',
      offerDiscountValue: String(operational?.pricing?.offerDiscountValue ?? 0),
      isOfferActive: Boolean(operational?.pricing?.isOfferActive),
      durationMinutes: String(operational?.durationMinutes ?? 30),
    });
    setFormError(null);
    setFormOpen(true);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const payload = {
      categorySlug: form.categorySlug.trim(),
      skuSlug: form.skuSlug.trim(),
      displayName: form.displayName.trim(),
      shortDescription: form.shortDescription.trim(),
      longDescription: form.longDescription.trim(),
      includes: linesToArray(form.includesText),
      excludes: linesToArray(form.excludesText),
      sortOrder: Number(form.sortOrder) || 0,
      isActive: form.isActive,
    };
    if (!payload.categorySlug || !payload.skuSlug || !payload.displayName) {
      setFormError('Parent service, SKU slug, and package name are required');
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        await catalogApi(`/api/v1/catalog/internal/skus/content/${editingId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      } else {
        await catalogApi('/api/v1/catalog/internal/skus/content', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      const operational = operationalByComposite.get(`${payload.categorySlug}::${payload.skuSlug}`);
      if (operational?._id) {
        await catalogApi(`/api/v1/catalog/internal/skus/operational/${operational._id}/offer`, {
          method: 'PATCH',
          body: JSON.stringify({
            basePrice: Number(form.originalPrice) || 0,
            offerDiscountType: form.offerDiscountType,
            offerDiscountValue: Number(form.offerDiscountValue) || 0,
            isOfferActive: form.isOfferActive,
            durationMinutes: Number(form.durationMinutes) || 30,
          }),
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

  const toggleActive = async (row: SkuContentRow) => {
    try {
      await catalogApi(`/api/v1/catalog/internal/skus/content/${row._id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !row.isActive }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Status update failed');
    }
  };

  return (
    <>
      <div className="mgmt-page-head">
        <div>
          <h1 className="mgmt-title">Book Now packages / SKUs</h1>
          <p className="mgmt-subtitle muted">
            Manage packages under each Book Now service, including SKU ids and pricing.
          </p>
        </div>
        <button className="btn btn-primary" type="button" onClick={openCreate}>
          Add package
        </button>
      </div>

      <div className="mgmt-toolbar">
        <input
          className="mgmt-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search package, SKU, or service..."
        />
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
              <th>Service</th>
              <th>Package</th>
              <th>SKU</th>
              <th>Price</th>
              <th>Offer</th>
              <th>Includes</th>
              <th>Status</th>
              <th className="th-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="mgmt-empty">
                  Loading…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="mgmt-empty">
                  No packages found.
                </td>
              </tr>
            ) : (
              pagedRows.map((row) => (
                <tr key={row._id}>
                  {(() => {
                    const operational = operationalByComposite.get(`${row.categorySlug}::${row.skuSlug}`);
                    const original = operational?.pricing?.originalPrice ?? operational?.basePrice ?? 0;
                    const offer = operational?.pricing?.offerPrice ?? original;
                    const off = operational?.pricing?.appliedPercent ?? 0;
                    return (
                      <>
                  <td>
                    <div className="td-code">
                      <strong>{getServiceLabel(row.categorySlug)}</strong>
                      <span className="meta-tag">Service</span>
                    </div>
                  </td>
                  <td>{row.displayName}</td>
                  <td>
                    <span className="code-pill">{row.skuSlug}</span>
                  </td>
                  <td className="td-muted">₹{original}</td>
                  <td className="td-muted">
                    {operational?.pricing?.isOfferActive ? `₹${offer} (${off}% off)` : 'No offer'}
                  </td>
                  <td className="td-muted">{(row.includes || []).length} items</td>
                  <td>
                    <span className={`badge ${row.isActive ? 'badge-on' : 'badge-off'}`}>
                      {row.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <div className="action-group">
                      <button
                        className="btn btn-ghost btn-sm"
                        type="button"
                        onClick={() => startEdit(row)}
                      >
                        Edit
                      </button>
                      <button
                        className={`btn btn-sm ${row.isActive ? 'btn-ghost' : 'btn-success'}`}
                        type="button"
                        onClick={() => void toggleActive(row)}
                      >
                        {row.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </td>
                      </>
                    );
                  })()}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <PaginationControls
        page={page}
        pageSize={pageSize}
        totalItems={filtered.length}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
      />

      {formOpen ? (
        <div className="modal-backdrop" onClick={closeForm} role="presentation">
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-head">
              <h2>{editingId ? 'Edit package' : 'Add package'}</h2>
              <button className="btn btn-ghost btn-sm" type="button" onClick={closeForm}>
                Close
              </button>
            </div>
            <form className="coupon-form" onSubmit={(e) => void onSubmit(e)}>
              <label>
                Parent service
                <select
                  value={form.categorySlug}
                  onChange={(e) => setForm((f) => ({ ...f, categorySlug: e.target.value }))}
                  required
                >
                  {parentServiceOptions.map((opt) => (
                    <option key={opt.slug} value={opt.slug}>
                      {opt.label} ({opt.slug})
                    </option>
                  ))}
                </select>
              </label>
              <label>
                SKU slug
                <input
                  value={form.skuSlug}
                  onChange={(e) => setForm((f) => ({ ...f, skuSlug: e.target.value }))}
                  required
                />
              </label>
              <label>
                Package name
                <input
                  value={form.displayName}
                  onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
                  required
                />
              </label>
              <label>
                Short description
                <input
                  value={form.shortDescription}
                  onChange={(e) => setForm((f) => ({ ...f, shortDescription: e.target.value }))}
                />
              </label>
              <label>
                Long description
                <textarea
                  rows={3}
                  value={form.longDescription}
                  onChange={(e) => setForm((f) => ({ ...f, longDescription: e.target.value }))}
                />
              </label>
              <label>
                Includes (one per line)
                <textarea
                  rows={5}
                  value={form.includesText}
                  onChange={(e) => setForm((f) => ({ ...f, includesText: e.target.value }))}
                />
              </label>
              <label>
                Excludes (one per line)
                <textarea
                  rows={4}
                  value={form.excludesText}
                  onChange={(e) => setForm((f) => ({ ...f, excludesText: e.target.value }))}
                />
              </label>
              <label>
                Original price (₹)
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.originalPrice}
                  onChange={(e) => setForm((f) => ({ ...f, originalPrice: e.target.value }))}
                />
              </label>
              <label>
                Offer type
                <select
                  value={form.offerDiscountType}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      offerDiscountType: e.target.value as 'percent' | 'flat',
                    }))
                  }
                >
                  <option value="percent">Percent</option>
                  <option value="flat">Flat</option>
                </select>
              </label>
              <label>
                Offer value
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.offerDiscountValue}
                  onChange={(e) => setForm((f) => ({ ...f, offerDiscountValue: e.target.value }))}
                />
              </label>
              <label>
                Duration (minutes)
                <input
                  type="number"
                  min={15}
                  value={form.durationMinutes}
                  onChange={(e) => setForm((f) => ({ ...f, durationMinutes: e.target.value }))}
                />
              </label>
              <label>
                Sort order
                <input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
                />
              </label>
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                />
                Active
              </label>
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={form.isOfferActive}
                  onChange={(e) => setForm((f) => ({ ...f, isOfferActive: e.target.checked }))}
                />
                Offer active
              </label>
              {formError ? <p className="error">{formError}</p> : null}
              <div className="form-actions">
                <button className="btn btn-ghost" type="button" onClick={closeForm}>
                  Cancel
                </button>
                <button className="btn btn-primary" type="submit" disabled={saving}>
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
