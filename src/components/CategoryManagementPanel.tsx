import { FormEvent, Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { catalogApi } from '../api/catalogApi';
import { PaginationControls } from './PaginationControls';

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

type ServiceContentRow = {
  categorySlug: string;
  title: string;
  isActive: boolean;
};

type FormState = {
  slug: string;
  title: string;
  iconKey: string;
  sortOrder: string;
  services: HubServiceItem[];
  isActive: boolean;
};

const emptyForm: FormState = {
  slug: '',
  title: '',
  iconKey: 'Broom',
  sortOrder: '0',
  services: [],
  isActive: true,
};

function createEmptyService(sortOrder = 0): HubServiceItem {
  return {
    serviceId: '',
    label: '',
    categorySlug: '',
    sectionId: '',
    imageUrl: '',
    sortOrder,
    isActive: true,
  };
}

export function CategoryManagementPanel() {
  const [rows, setRows] = useState<HubSectionRow[]>([]);
  const [serviceContentRows, setServiceContentRows] = useState<ServiceContentRow[]>([]);
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);
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
      const [sections, services] = await Promise.all([
        catalogApi<{ success: boolean; data: HubSectionRow[] }>(
          '/api/v1/catalog/internal/hub-sections?includeInactive=true',
        ),
        catalogApi<{ success: boolean; data: ServiceContentRow[] }>(
          '/api/v1/catalog/internal/categories/content?includeInactive=true',
        ),
      ]);
      setRows(Array.isArray(sections.data) ? sections.data : []);
      setServiceContentRows(Array.isArray(services.data) ? services.data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const serviceTitleBySlug = useMemo(() => {
    const map = new Map<string, ServiceContentRow>();
    for (const row of serviceContentRows) {
      map.set(row.categorySlug, row);
    }
    return map;
  }, [serviceContentRows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const ordered = [...rows].sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      return a.title.localeCompare(b.title);
    });
    if (!q) return ordered;
    return ordered.filter((row) =>
      [
        row.title,
        row.slug,
        row.iconKey,
        ...(row.services || []).flatMap((service) => [
          service.label,
          service.serviceId,
          service.categorySlug,
        ]),
      ]
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

  const closeForm = () => {
    setFormOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    setFormError(null);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormError(null);
    setFormOpen(true);
  };

  const startEdit = (row: HubSectionRow) => {
    setEditingId(row._id || null);
    setForm({
      slug: row.slug,
      title: row.title,
      iconKey: row.iconKey || 'Broom',
      sortOrder: String(row.sortOrder ?? 0),
      services: (row.services || []).map((service) => ({
        serviceId: service.serviceId || '',
        label: service.label || '',
        categorySlug: service.categorySlug || '',
        sectionId: service.sectionId || '',
        imageUrl: service.imageUrl || '',
        sortOrder: Number(service.sortOrder || 0),
        isActive: service.isActive !== false,
      })),
      isActive: row.isActive,
    });
    setFormError(null);
    setFormOpen(true);
  };

  const saveSection = async (payload: {
    slug: string;
    title: string;
    iconKey: string;
    sortOrder: number;
    services: HubServiceItem[];
    isActive: boolean;
  }) => {
    if (editingId) {
      await catalogApi(`/api/v1/catalog/internal/hub-sections/${editingId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      return;
    }

    await catalogApi('/api/v1/catalog/internal/hub-sections', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const payload = {
      slug: form.slug.trim(),
      title: form.title.trim(),
      iconKey: form.iconKey.trim(),
      sortOrder: Number(form.sortOrder) || 0,
      services: form.services
        .map((service, index) => ({
          serviceId: service.serviceId.trim(),
          label: service.label.trim(),
          categorySlug: service.categorySlug.trim(),
          sectionId: service.sectionId?.trim() || '',
          imageUrl: service.imageUrl?.trim() || '',
          sortOrder: Number(service.sortOrder) || index * 10,
          isActive: service.isActive !== false,
        }))
        .filter((service) => service.serviceId && service.label && service.categorySlug),
      isActive: form.isActive,
    };
    if (!payload.slug || !payload.title) {
      setFormError('Category slug and title are required');
      return;
    }

    setSaving(true);
    try {
      await saveSection(payload);
      closeForm();
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (row: HubSectionRow) => {
    const payload = {
      slug: row.slug,
      title: row.title,
      iconKey: row.iconKey || '',
      sortOrder: row.sortOrder || 0,
      services: row.services || [],
      isActive: !row.isActive,
    };
    try {
      if (row._id) {
        await catalogApi(`/api/v1/catalog/internal/hub-sections/${row._id}`, {
          method: 'PATCH',
          body: JSON.stringify({ isActive: !row.isActive }),
        });
      } else {
        await catalogApi('/api/v1/catalog/internal/hub-sections', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Status update failed');
    }
  };

  const updateFormService = (index: number, patch: Partial<HubServiceItem>) => {
    setForm((current) => ({
      ...current,
      services: current.services.map((service, serviceIndex) =>
        serviceIndex === index ? { ...service, ...patch } : service,
      ),
    }));
  };

  const addFormService = () => {
    setForm((current) => ({
      ...current,
      services: [...current.services, createEmptyService(current.services.length * 10)],
    }));
  };

  const removeFormService = (index: number) => {
    setForm((current) => ({
      ...current,
      services: current.services.filter((_, serviceIndex) => serviceIndex !== index),
    }));
  };

  return (
    <>
      <div className="mgmt-page-head">
        <div>
          <h1 className="mgmt-title">Book Now categories</h1>
          <p className="mgmt-subtitle muted">
            Manage parent categories and review the services nested under each one.
          </p>
        </div>
        <button className="btn btn-primary" type="button" onClick={openCreate}>
          Add category
        </button>
      </div>

      <div className="mgmt-toolbar">
        <input
          className="mgmt-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search category or service..."
        />
        <button
          className="btn btn-ghost btn-sm mgmt-refresh"
          type="button"
          onClick={() => void load()}
          disabled={loading}
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {error ? <p className="error mgmt-error">{error}</p> : null}

      <div className="mgmt-table-wrap">
        <table className="mgmt-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Slug</th>
              <th>Services</th>
              <th>Sort</th>
              <th>Status</th>
              <th className="th-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="mgmt-empty">
                  Loading...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="mgmt-empty">
                  No categories found.
                </td>
              </tr>
            ) : (
              pagedRows.map((row) => {
                const expanded = expandedSlug === row.slug;
                const activeServices = (row.services || []).filter((service) => service.isActive !== false);
                return (
                  <Fragment key={row.slug}>
                    <tr key={row.slug} className="expandable-row">
                      <td>
                        <button
                          className="row-toggle"
                          type="button"
                          onClick={() => setExpandedSlug(expanded ? null : row.slug)}
                        >
                          <span className="row-caret">{expanded ? 'v' : '>'}</span>
                          <span className="td-code">
                            <strong>{row.title}</strong>
                            {row.iconKey ? <span className="meta-tag">{row.iconKey}</span> : null}
                          </span>
                        </button>
                      </td>
                      <td>
                        <span className="code-pill">{row.slug}</span>
                      </td>
                      <td className="td-muted">
                        {activeServices.length} active / {(row.services || []).length} total
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
                    {expanded ? (
                      <tr key={`${row.slug}-services`}>
                        <td colSpan={6} className="expanded-cell">
                          <div className="nested-services">
                            {(row.services || []).length === 0 ? (
                              <p className="nested-empty">No services are attached to this category.</p>
                            ) : (
                              [...row.services]
                                .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
                                .map((service) => {
                                  const content = serviceTitleBySlug.get(service.categorySlug);
                                  return (
                                    <div key={`${service.serviceId}-${service.categorySlug}`} className="nested-service">
                                      <div>
                                        <strong>{service.label}</strong>
                                        {content?.title && content.title !== service.label ? (
                                          <span>{content.title}</span>
                                        ) : null}
                                      </div>
                                      <span className="code-pill">{service.categorySlug}</span>
                                      <span className={`badge ${service.isActive !== false ? 'badge-on' : 'badge-off'}`}>
                                        {service.isActive !== false ? 'Active' : 'Inactive'}
                                      </span>
                                    </div>
                                  );
                                })
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })
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
              <h2>{editingId ? 'Edit category' : 'Add category'}</h2>
              <button className="btn btn-ghost btn-sm" type="button" onClick={closeForm}>
                Close
              </button>
            </div>
            <form className="coupon-form" onSubmit={(e) => void onSubmit(e)}>
              <label>
                Category slug
                <input
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  required
                />
              </label>
              <label>
                Category title
                <input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  required
                />
              </label>
              <label>
                Icon key
                <input
                  value={form.iconKey}
                  onChange={(e) => setForm((f) => ({ ...f, iconKey: e.target.value }))}
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
              <div className="full-width-field">
                <div className="inline-section-head">
                  <span>Services</span>
                  <button className="btn btn-ghost btn-sm" type="button" onClick={addFormService}>
                    Add service row
                  </button>
                </div>
                <div className="service-editor-list">
                  {form.services.length === 0 ? (
                    <div className="service-editor-empty">No services added to this category yet.</div>
                  ) : (
                    form.services.map((service, index) => (
                      <div key={`${service.categorySlug || 'service'}-${index}`} className="service-editor-card">
                        <div className="service-editor-grid">
                          <label>
                            Service id
                            <input
                              value={service.serviceId}
                              onChange={(e) => updateFormService(index, { serviceId: e.target.value })}
                              placeholder="cupboard-drawer"
                            />
                          </label>
                          <label>
                            Label
                            <input
                              value={service.label}
                              onChange={(e) => updateFormService(index, { label: e.target.value })}
                              placeholder="Cupboard & Drawer"
                            />
                          </label>
                          <label>
                            Service slug
                            <input
                              value={service.categorySlug}
                              onChange={(e) =>
                                updateFormService(index, { categorySlug: e.target.value })
                              }
                              placeholder="carpenter-cupboard-drawer"
                            />
                          </label>
                          <label>
                            Section id
                            <input
                              value={service.sectionId || ''}
                              onChange={(e) => updateFormService(index, { sectionId: e.target.value })}
                              placeholder="optional"
                            />
                          </label>
                          <label>
                            Image URL
                            <input
                              value={service.imageUrl || ''}
                              onChange={(e) => updateFormService(index, { imageUrl: e.target.value })}
                              placeholder="https://..."
                            />
                          </label>
                          <label>
                            Sort order
                            <input
                              type="number"
                              value={service.sortOrder}
                              onChange={(e) =>
                                updateFormService(index, {
                                  sortOrder: Number(e.target.value) || 0,
                                })
                              }
                            />
                          </label>
                        </div>
                        <div className="service-editor-actions">
                          <label className="checkbox-row">
                            <input
                              type="checkbox"
                              checked={service.isActive !== false}
                              onChange={(e) =>
                                updateFormService(index, { isActive: e.target.checked })
                              }
                            />
                            Active
                          </label>
                          <button
                            className="btn btn-danger btn-sm"
                            type="button"
                            onClick={() => removeFormService(index)}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
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
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
