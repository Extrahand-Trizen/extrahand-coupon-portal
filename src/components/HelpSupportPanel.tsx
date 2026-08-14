import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { catalogApi } from '../api/catalogApi';
import { PaginationControls } from './PaginationControls';

type HelpVariant = 'customer' | 'helper';

export type HelpSupportRow = {
  _id: string;
  variant: HelpVariant;
  categoryKey: string;
  title: string;
  subtitle: string;
  icon: string;
  items: Array<{ q: string; a: string }>;
  sortOrder: number;
  isActive: boolean;
};

type FormState = {
  categoryKey: string;
  title: string;
  subtitle: string;
  icon: string;
  itemsText: string;
  sortOrder: string;
  isActive: boolean;
};

const emptyForm: FormState = {
  categoryKey: '',
  title: '',
  subtitle: '',
  icon: 'HelpCircle',
  itemsText: '',
  sortOrder: '0',
  isActive: true,
};

function itemsToText(items: Array<{ q: string; a: string }>): string {
  return items.map((item) => `Q: ${item.q}\nA: ${item.a}`).join('\n\n');
}

function textToItems(text: string): Array<{ q: string; a: string }> {
  const blocks = text
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);
  const items: Array<{ q: string; a: string }> = [];
  for (const block of blocks) {
    const lines = block.split('\n').map((line) => line.trim());
    const qLine = lines.find((line) => /^Q:\s*/i.test(line));
    const aLine = lines.find((line) => /^A:\s*/i.test(line));
    if (!qLine || !aLine) continue;
    items.push({
      q: qLine.replace(/^Q:\s*/i, '').trim(),
      a: aLine.replace(/^A:\s*/i, '').trim(),
    });
  }
  return items;
}

export function HelpSupportPanel() {
  const [variant, setVariant] = useState<HelpVariant>('customer');
  const [rows, setRows] = useState<HelpSupportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await catalogApi<{ success: boolean; data: HelpSupportRow[] }>(
        `/api/v1/catalog/internal/help-support/${variant}?includeInactive=true`,
      );
      setRows(Array.isArray(data.data) ? data.data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load help support');
    } finally {
      setLoading(false);
    }
  }, [variant]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [variant]);

  const pagedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return rows.slice(start, start + pageSize);
  }, [page, pageSize, rows]);

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

  const startEdit = (row: HelpSupportRow) => {
    setEditingId(row._id);
    setForm({
      categoryKey: row.categoryKey,
      title: row.title,
      subtitle: row.subtitle,
      icon: row.icon,
      itemsText: itemsToText(row.items || []),
      sortOrder: String(row.sortOrder ?? 0),
      isActive: row.isActive,
    });
    setFormError(null);
    setFormOpen(true);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const items = textToItems(form.itemsText);
    if (!form.categoryKey.trim() || !form.title.trim() || !form.subtitle.trim() || !form.icon.trim()) {
      setFormError('Category key, title, subtitle, and icon are required');
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        await catalogApi(`/api/v1/catalog/internal/help-support/${editingId}`, {
          method: 'PATCH',
          body: JSON.stringify({
            categoryKey: form.categoryKey.trim(),
            title: form.title.trim(),
            subtitle: form.subtitle.trim(),
            icon: form.icon.trim(),
            items,
            sortOrder: Number(form.sortOrder) || 0,
            isActive: form.isActive,
          }),
        });
      } else {
        await catalogApi(
          `/api/v1/catalog/internal/help-support/${variant}/${encodeURIComponent(form.categoryKey.trim())}`,
          {
            method: 'PUT',
            body: JSON.stringify({
              title: form.title.trim(),
              subtitle: form.subtitle.trim(),
              icon: form.icon.trim(),
              items,
              sortOrder: Number(form.sortOrder) || 0,
              isActive: form.isActive,
            }),
          },
        );
      }
      closeForm();
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (row: HelpSupportRow) => {
    try {
      await catalogApi(`/api/v1/catalog/internal/help-support/${row._id}`, {
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
          <h1 className="mgmt-title">Help &amp; Support FAQs</h1>
          <p className="mgmt-subtitle muted">
            Manage in-app FAQ categories for customer and helper variants.
          </p>
        </div>
        <button className="btn btn-primary" type="button" onClick={openCreate}>
          Add category
        </button>
      </div>

      <div className="mgmt-toolbar">
        <select
          className="mgmt-filter"
          value={variant}
          onChange={(e) => setVariant(e.target.value as HelpVariant)}
        >
          <option value="customer">Customer</option>
          <option value="helper">Helper</option>
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
              <th>Title</th>
              <th>Key</th>
              <th>Items</th>
              <th>Status</th>
              <th className="th-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="mgmt-empty">
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="mgmt-empty">
                  No FAQ categories for this variant.
                </td>
              </tr>
            ) : (
              pagedRows.map((row) => (
                <tr key={row._id}>
                  <td>
                    <div className="td-code">
                      <strong>{row.title}</strong>
                      <span className="meta-tag">{row.subtitle}</span>
                    </div>
                  </td>
                  <td>
                    <span className="code-pill">{row.categoryKey}</span>
                  </td>
                  <td className="td-muted">{(row.items || []).length}</td>
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
        totalItems={rows.length}
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
              <h2>{editingId ? 'Edit FAQ category' : 'Add FAQ category'}</h2>
              <button className="btn btn-ghost btn-sm" type="button" onClick={closeForm}>
                Close
              </button>
            </div>
            <form className="coupon-form" onSubmit={(e) => void onSubmit(e)}>
              <label>
                Category key
                <input
                  value={form.categoryKey}
                  onChange={(e) => setForm((f) => ({ ...f, categoryKey: e.target.value }))}
                  required
                  disabled={Boolean(editingId)}
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
                  required
                />
              </label>
              <label>
                Icon name
                <input
                  value={form.icon}
                  onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
                  required
                />
              </label>
              <label>
                FAQ items (blocks of Q: / A:)
                <textarea
                  rows={10}
                  value={form.itemsText}
                  onChange={(e) => setForm((f) => ({ ...f, itemsText: e.target.value }))}
                  placeholder={'Q: How does ExtraHand work?\nA: Customers post work...\n\nQ: ...\nA: ...'}
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
