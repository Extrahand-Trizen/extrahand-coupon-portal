import { FormEvent, useEffect, useMemo, useState } from 'react';
import { PaginationControls } from './PaginationControls';

export type NotificationTemplate = {
  _id: string;
  name: string;
  templateKey: string;
  audience: 'customers' | 'helpers' | 'both';
  title: string;
  body: string;
  placeholders: string[];
  category: string;
  imageUrl?: string;
  deepLink?: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
};

type FormState = {
  name: string;
  templateKey: string;
  audience: 'customers' | 'helpers' | 'both';
  title: string;
  body: string;
  placeholdersText: string;
  category: string;
  imageUrl: string;
  deepLink: string;
  isActive: boolean;
};

const emptyForm: FormState = {
  name: '',
  templateKey: '',
  audience: 'customers',
  title: '',
  body: '',
  placeholdersText: '',
  category: 'promotions',
  imageUrl: '',
  deepLink: '',
  isActive: true,
};

async function templatesApi<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Service-Name': 'coupon-portal',
    ...(init?.headers as Record<string, string> | undefined),
  };

  // Vite proxy routes /api/v1/notifications to notification-service on port 4005
  const res = await fetch(`/api/v1/notifications${path}`, {
    ...init,
    headers,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || data?.message || `Request failed (${res.status})`);
  }
  return data as T;
}

export function NotificationTemplatesPanel() {
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
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

  const [uploadingImage, setUploadingImage] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setFormError(null);

    const formData = new FormData();
    formData.append('image', file);

    try {
      const headers: Record<string, string> = {
        'X-Service-Name': 'coupon-portal',
      };
      
      const res = await fetch('/api/v1/notifications/upload', {
        method: 'POST',
        headers,
        body: formData,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || data?.message || 'Image upload failed');
      }

      setForm((prev) => ({ ...prev, imageUrl: data.url }));
    } catch (err: any) {
      setFormError(err?.message || 'Image upload failed');
    } finally {
      setUploadingImage(false);
    }
  };

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await templatesApi<{ data: NotificationTemplate[] }>('/templates?includeInactive=true');
      setTemplates(res.data || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filteredTemplates = useMemo(() => {
    const q = query.trim().toLowerCase();
    return templates.filter((t) => {
      if (!q) return true;
      return (
        t.name.toLowerCase().includes(q) ||
        t.templateKey.toLowerCase().includes(q) ||
        t.title.toLowerCase().includes(q) ||
        t.body.toLowerCase().includes(q)
      );
    });
  }, [templates, query]);

  useEffect(() => {
    setPage(1);
  }, [query]);

  const pagedTemplates = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredTemplates.slice(start, start + pageSize);
  }, [page, pageSize, filteredTemplates]);

  const closeForm = () => {
    setFormOpen(false);
    setForm(emptyForm);
    setEditingId(null);
    setFormError(null);
  };

  const startCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setFormError(null);
    setFormOpen(true);
  };

  const startEdit = (t: NotificationTemplate) => {
    setEditingId(t._id);
    setForm({
      name: t.name,
      templateKey: t.templateKey,
      audience: t.audience,
      title: t.title,
      body: t.body,
      placeholdersText: (t.placeholders || []).join(', '),
      category: t.category || 'promotions',
      imageUrl: t.imageUrl || '',
      deepLink: t.deepLink || '',
      isActive: t.isActive,
    });
    setFormError(null);
    setFormOpen(true);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const parsedPlaceholders = form.placeholdersText
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);

    const payload = {
      name: form.name.trim(),
      templateKey: form.templateKey.trim().toLowerCase(),
      audience: form.audience,
      title: form.title.trim(),
      body: form.body.trim(),
      placeholders: parsedPlaceholders,
      category: form.category,
      imageUrl: form.imageUrl.trim() || undefined,
      deepLink: form.deepLink.trim() || undefined,
      isActive: form.isActive,
    };

    setSaving(true);
    try {
      if (editingId) {
        await templatesApi(`/templates/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await templatesApi('/templates', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      closeForm();
      await load();
    } catch (err: any) {
      setFormError(err?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const toggleActiveStatus = async (t: NotificationTemplate) => {
    try {
      await templatesApi(`/templates/${t._id}`, {
        method: 'PUT',
        body: JSON.stringify({ isActive: !t.isActive }),
      });
      await load();
    } catch (err: any) {
      setError(err?.message || 'Status toggle failed');
    }
  };

  const deleteTemplate = async (t: NotificationTemplate) => {
    const confirm = window.confirm(`Permanently delete template "${t.name}"? This cannot be undone.`);
    if (!confirm) return;
    try {
      await templatesApi(`/templates/${t._id}?hardDelete=true`, {
        method: 'DELETE',
      });
      await load();
    } catch (err: any) {
      setError(err?.message || 'Deletion failed');
    }
  };

  return (
    <div className="panel">
      <div className="mgmt-page-head">
        <div>
          <h1 className="mgmt-title">Notification Templates</h1>
          <p className="mgmt-subtitle muted">
            Manage reusable messages with placeholder tags for bulk campaign dispatches.
          </p>
        </div>
        <div className="action-group">
          <button className="btn btn-primary" type="button" onClick={startCreate}>
            Create template
          </button>
        </div>
      </div>

      <div className="filter-bar">
        <input
          className="search-input"
          placeholder="Filter templates by name, key, title, body..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {error ? <p className="error-banner">{error}</p> : null}

      {loading ? (
        <p className="muted text-center">Loading templates...</p>
      ) : filteredTemplates.length === 0 ? (
        <div className="empty-state">
          <p className="muted">No notification templates found. Create one to get started!</p>
        </div>
      ) : (
        <>
          <div className="table-wrap">
            <table className="mgmt-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Key / Category</th>
                  <th>Audience</th>
                  <th>Message Preview</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pagedTemplates.map((t) => (
                  <tr key={t._id}>
                    <td>
                      <strong>{t.name}</strong>
                      <div className="muted small">{new Date(t.createdAt).toLocaleDateString()}</div>
                    </td>
                    <td>
                      <code className="text-secondary">{t.templateKey}</code>
                      <div className="muted small">Pref category: {t.category}</div>
                    </td>
                    <td>
                      <span className={`badge-pill badge-pill-${t.audience}`}>
                        {t.audience.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ maxWidth: '300px' }}>
                      <div className="bold small">{t.title}</div>
                      <div className="muted text-ellipsis small">{t.body}</div>
                      {t.placeholders.length > 0 && (
                        <div className="placeholder-tags">
                          {t.placeholders.map((p) => (
                            <span key={p} className="placeholder-tag">
                              {`{{${p}}}`}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={`pill ${t.isActive ? 'pill-exists' : 'pill-gap'}`}>
                        {t.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="action-row">
                        <button className="btn btn-secondary btn-sm" type="button" onClick={() => startEdit(t)}>
                          Edit
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          type="button"
                          onClick={() => void toggleActiveStatus(t)}
                        >
                          {t.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          className="btn btn-ghost btn-sm text-error"
                          type="button"
                          onClick={() => void deleteTemplate(t)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <PaginationControls
            page={page}
            totalItems={filteredTemplates.length}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(sz) => {
              setPageSize(sz);
              setPage(1);
            }}
          />
        </>
      )}

      {formOpen ? (
        <div className="modal-backdrop" onClick={closeForm} role="presentation">
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="template-form-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-head">
              <h2 id="template-form-title">{editingId ? 'Edit notification template' : 'Create notification template'}</h2>
              <button className="btn btn-ghost btn-sm" type="button" onClick={closeForm}>
                Close
              </button>
            </div>

            <form className="coupon-form" onSubmit={onSubmit}>
              <div className="form-grid">
                <label>
                  Template Display Name
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Festival Sale Promo"
                    required
                  />
                </label>

                <label>
                  Template Key (stable slug)
                  <input
                    value={form.templateKey}
                    onChange={(e) => setForm({ ...form, templateKey: e.target.value })}
                    placeholder="festival_sale"
                    disabled={!!editingId}
                    required
                  />
                </label>

                <label>
                  Target Audience
                  <select
                    value={form.audience}
                    onChange={(e) =>
                      setForm({ ...form, audience: e.target.value as FormState['audience'] })
                    }
                  >
                    <option value="customers">Customers only</option>
                    <option value="helpers">Helpers only</option>
                    <option value="both">Both (Customers & Helpers)</option>
                  </select>
                </label>

                <label>
                  Notification Preference Category
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  >
                    <option value="promotions">Promotions (Marketing)</option>
                    <option value="taskUpdates">Task Updates (Transactional)</option>
                    <option value="payments">Payments (Billing)</option>
                    <option value="system">System Alerts</option>
                  </select>
                </label>
              </div>

              <label className="full-width-field">
                Message Title
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Hey {{name}}, massive discount alert! 🎉"
                  required
                />
              </label>

              <label className="full-width-field">
                Message Body
                <textarea
                  rows={4}
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  placeholder="Use code {{code}} to claim {{discount}} off your next service. Offer expires {{expiry}}!"
                  required
                />
              </label>

              <label className="full-width-field">
                Placeholders / Variables (comma-separated slugs)
                <input
                  value={form.placeholdersText}
                  onChange={(e) => setForm({ ...form, placeholdersText: e.target.value })}
                  placeholder="name, code, discount, expiry"
                />
                <span className="muted small">List the dynamic placeholders matching tags in Title and Body text.</span>
              </label>

              <div className="form-grid">
                <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  Optional Image (Upload local file)
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '8px',
                      fontSize: '13px',
                      border: '1px solid var(--line, #ccc)',
                      borderRadius: '6px',
                      background: 'var(--paper, #fff)',
                      cursor: 'pointer',
                      boxSizing: 'border-box'
                    }}
                  />
                  {uploadingImage && <span className="muted small" style={{ display: 'block', marginTop: '4px' }}>Uploading image...</span>}
                  {form.imageUrl && (
                    <div style={{ marginTop: '8px', marginBottom: '8px' }}>
                      <span className="text-success small">✓ Uploaded successfully!</span>
                      <br />
                      <img src={form.imageUrl} alt="Uploaded Preview" style={{ maxWidth: '120px', maxHeight: '120px', marginTop: '4px', borderRadius: '4px', border: '1px solid #ccc' }} />
                    </div>
                  )}
                </label>

                <label>
                  Optional Deep Link / Redirect Target
                  <input
                    value={form.deepLink}
                    onChange={(e) => setForm({ ...form, deepLink: e.target.value })}
                    placeholder="wallet / profile / coupons"
                  />
                </label>
              </div>

              <div className="check-row">
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
                  {saving ? 'Saving...' : editingId ? 'Update template' : 'Create template'}
                </button>
                <button className="btn btn-ghost" type="button" onClick={closeForm}>
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
