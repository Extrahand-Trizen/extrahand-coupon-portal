import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { catalogApi } from '../api/catalogApi';
import { PaginationControls } from './PaginationControls';

export type CategoryContentRow = {
  _id: string;
  categorySlug: string;
  title: string;
  subtitle?: string;
  description?: string;
  heroImageUrl?: string;
  iconUrl?: string;
  faqCategoryKeys: string[];
  sortOrder: number;
  isActive: boolean;
};

type HubServiceItem = {
  serviceId: string;
  label: string;
  categorySlug: string;
  sectionId?: string;
  imageUrl?: string;
  sortOrder: number;
  isActive: boolean;
};

type HubSectionRow = {
  _id?: string;
  slug: string;
  title: string;
  iconKey?: string;
  sortOrder: number;
  services: HubServiceItem[];
  isActive: boolean;
};

type FormState = {
  parentCategorySlug: string;
  categorySlug: string;
  title: string;
  subtitle: string;
  description: string;
  heroImageUrl: string;
  iconUrl: string;
  sortOrder: string;
  isActive: boolean;
};

const emptyForm: FormState = {
  parentCategorySlug: '',
  categorySlug: '',
  title: '',
  subtitle: '',
  description: '',
  heroImageUrl: '',
  iconUrl: '',
  sortOrder: '0',
  isActive: true,
};

export function CategoryContentPanel() {
  const [rows, setRows] = useState<CategoryContentRow[]>([]);
  const [hubSections, setHubSections] = useState<HubSectionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await catalogApi<{ success: boolean; data: CategoryContentRow[] }>(
        '/api/v1/catalog/internal/categories/content?includeInactive=true',
      );
      setRows(Array.isArray(data.data) ? data.data : []);
      const sections = await catalogApi<{ success: boolean; data: HubSectionRow[] }>(
        '/api/v1/catalog/internal/hub-sections?includeInactive=true',
      );
      setHubSections(Array.isArray(sections.data) ? sections.data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load services');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) =>
      [row.title, row.subtitle, row.description, row.categorySlug]
        .join(' ')
        .toLowerCase()
        .includes(q),
    );
  }, [query, rows]);

  useEffect(() => {
    setPage(1);
  }, [query]);

  const pagedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const parentCategoryOptions = useMemo(
    () =>
      [...hubSections].sort((a, b) => {
        if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
        return a.title.localeCompare(b.title);
      }),
    [hubSections],
  );

  const parentByServiceSlug = useMemo(() => {
    const map = new Map<string, HubSectionRow>();
    for (const section of hubSections) {
      for (const service of section.services || []) {
        map.set(service.categorySlug, section);
      }
    }
    return map;
  }, [hubSections]);

  const saveHubSection = async (section: HubSectionRow, services: HubServiceItem[]) => {
    const payload = {
      slug: section.slug,
      title: section.title,
      iconKey: section.iconKey || '',
      sortOrder: Number(section.sortOrder || 0),
      services,
      isActive: section.isActive,
    };
    if (section._id) {
      await catalogApi(`/api/v1/catalog/internal/hub-sections/${section._id}`, {
        method: 'PATCH',
        body: JSON.stringify({ services }),
      });
      return;
    }
    await catalogApi('/api/v1/catalog/internal/hub-sections', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  };

  const attachServiceToParentCategory = async (
    payload: {
      categorySlug: string;
      title: string;
      heroImageUrl: string;
      sortOrder: number;
      isActive: boolean;
    },
    oldCategorySlug?: string,
  ) => {
    const target = hubSections.find((section) => section.slug === form.parentCategorySlug);
    if (!target) return;

    const oldParent = oldCategorySlug ? parentByServiceSlug.get(oldCategorySlug) : undefined;
    if (oldParent && oldParent.slug !== target.slug) {
      await saveHubSection(
        oldParent,
        (oldParent.services || []).filter((service) => service.categorySlug !== oldCategorySlug),
      );
    }

    const existingServices = target.services || [];
    const serviceIndex = existingServices.findIndex(
      (service) => service.categorySlug === (oldCategorySlug || payload.categorySlug),
    );
    const nextService: HubServiceItem = {
      serviceId: payload.categorySlug,
      label: payload.title,
      categorySlug: payload.categorySlug,
      sectionId: '',
      imageUrl: payload.heroImageUrl,
      sortOrder: payload.sortOrder,
      isActive: payload.isActive,
    };
    const nextServices =
      serviceIndex >= 0
        ? existingServices.map((service, index) => (index === serviceIndex ? nextService : service))
        : [...existingServices, nextService];

    await saveHubSection(target, nextServices);
  };

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
      parentCategorySlug: parentCategoryOptions[0]?.slug || '',
    });
    setFormError(null);
    setFormOpen(true);
  };

  const startEdit = (row: CategoryContentRow) => {
    const parent = parentByServiceSlug.get(row.categorySlug);
    setEditingId(row._id);
    setForm({
      parentCategorySlug: parent?.slug || parentCategoryOptions[0]?.slug || '',
      categorySlug: row.categorySlug,
      title: row.title,
      subtitle: row.subtitle || '',
      description: row.description || '',
      heroImageUrl: row.heroImageUrl || '',
      iconUrl: row.iconUrl || '',
      sortOrder: String(row.sortOrder ?? 0),
      isActive: row.isActive,
    });
    setFormError(null);
    setFormOpen(true);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const payload = {
      categorySlug: form.categorySlug.trim(),
      title: form.title.trim(),
      subtitle: form.subtitle.trim(),
      description: form.description.trim(),
      heroImageUrl: form.heroImageUrl.trim(),
      iconUrl: form.iconUrl.trim(),
      sortOrder: Number(form.sortOrder) || 0,
      isActive: form.isActive,
    };
    if (!payload.categorySlug || !payload.title) {
      setFormError('Service slug and title are required');
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        await catalogApi(`/api/v1/catalog/internal/categories/content/${editingId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      } else {
        await catalogApi('/api/v1/catalog/internal/categories/content', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      await attachServiceToParentCategory(
        {
          categorySlug: payload.categorySlug,
          title: payload.title,
          heroImageUrl: payload.heroImageUrl,
          sortOrder: payload.sortOrder,
          isActive: payload.isActive,
        },
        editingId ? rows.find((row) => row._id === editingId)?.categorySlug : undefined,
      );
      closeForm();
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (row: CategoryContentRow) => {
    try {
      await catalogApi(`/api/v1/catalog/internal/categories/content/${row._id}`, {
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
          <h1 className="mgmt-title">Book Now services</h1>
          <p className="mgmt-subtitle muted">
            Manage the services customers see under Book Now categories.
          </p>
        </div>
        <button className="btn btn-primary" type="button" onClick={openCreate}>
          Add service
        </button>
      </div>

      <div className="mgmt-toolbar">
        <input
          className="mgmt-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search service name or slug..."
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
              <th>Title</th>
              <th>Category</th>
              <th>Service slug</th>
              <th>Sort</th>
              <th>Status</th>
              <th className="th-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="mgmt-empty">
                  Loading…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="mgmt-empty">
                  No services found.
                </td>
              </tr>
            ) : (
              pagedRows.map((row) => (
                <tr key={row._id}>
                  <td>
                    <div className="td-code">
                      <strong>{row.title}</strong>
                      {row.subtitle ? <span className="meta-tag">{row.subtitle}</span> : null}
                    </div>
                  </td>
                  <td className="td-muted">
                    {parentByServiceSlug.get(row.categorySlug)?.title || 'Unassigned'}
                  </td>
                  <td>
                    <span className="code-pill">{row.categorySlug}</span>
                  </td>
                  <td className="td-muted">{row.sortOrder}</td>
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
              <h2>{editingId ? 'Edit service' : 'Add service'}</h2>
              <button className="btn btn-ghost btn-sm" type="button" onClick={closeForm}>
                Close
              </button>
            </div>
            <form className="coupon-form" onSubmit={(e) => void onSubmit(e)}>
              <label>
                Parent category
                <select
                  value={form.parentCategorySlug}
                  onChange={(e) => setForm((f) => ({ ...f, parentCategorySlug: e.target.value }))}
                  required
                >
                  {parentCategoryOptions.map((opt) => (
                    <option key={opt.slug} value={opt.slug}>
                      {opt.title} ({opt.slug})
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Service slug
                <input
                  value={form.categorySlug}
                  onChange={(e) => setForm((f) => ({ ...f, categorySlug: e.target.value }))}
                  placeholder="example-service-slug"
                  required
                />
              </label>
              <label>
                Title
                <input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  required
                />
              </label>
              <label>
                Subtitle
                <input
                  value={form.subtitle}
                  onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
                />
              </label>
              <label>
                Description
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </label>
              <label>
                Hero image URL
                <input
                  value={form.heroImageUrl}
                  onChange={(e) => setForm((f) => ({ ...f, heroImageUrl: e.target.value }))}
                />
              </label>
              <label>
                Icon URL
                <input
                  value={form.iconUrl}
                  onChange={(e) => setForm((f) => ({ ...f, iconUrl: e.target.value }))}
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
