import { FormEvent, useEffect, useMemo, useState } from 'react';
import { PaginationControls } from './PaginationControls';
import { NotificationTemplate } from './NotificationTemplatesPanel';

export type NotificationCampaign = {
  _id: string;
  title: string;
  body: string;
  imageUrl?: string;
  deepLink?: string;
  templateId?: string;
  audienceFilter: Record<string, any>;
  audienceSize: number;
  status: 'DRAFT' | 'QUEUED' | 'SENDING' | 'COMPLETED' | 'FAILED' | 'PARTIAL';
  sentCount: number;
  failedCount: number;
  scheduledAt?: string;
  createdBy: string;
  createdAt: string;
};

type CampaignFormState = {
  title: string;
  body: string;
  imageUrl: string;
  deepLink: string;
  templateId: string;
  audienceRole: 'poster' | 'tasker' | 'partner' | 'all';
  audienceCity: string;
  audienceStatus: 'active' | 'suspended' | 'all';
  isAadhaarVerified: 'all' | 'true' | 'false';
  isCertified: 'all' | 'true' | 'false';
  scheduledLater: boolean;
  scheduledAt: string;
  placeholders: Record<string, string>;
};

const emptyCampaignForm: CampaignFormState = {
  title: '',
  body: '',
  imageUrl: '',
  deepLink: '',
  templateId: '',
  audienceRole: 'poster',
  audienceCity: '',
  audienceStatus: 'active',
  isAadhaarVerified: 'all',
  isCertified: 'all',
  scheduledLater: false,
  scheduledAt: '',
  placeholders: {},
};

async function campaignsApi<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Service-Name': 'coupon-portal',
    ...(init?.headers as Record<string, string> | undefined),
  };

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

export function NotificationCampaignsPanel() {
  const [campaigns, setCampaigns] = useState<NotificationCampaign[]>([]);
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<CampaignFormState>(emptyCampaignForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [previewSize, setPreviewSize] = useState<number | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

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

  const loadCampaigns = async () => {
    setLoading(true);
    setError(null);
    try {
      const skip = (page - 1) * pageSize;
      const res = await campaignsApi<{ data: { campaigns: NotificationCampaign[]; total: number } }>(
        `/campaigns?limit=${pageSize}&skip=${skip}`
      );
      setCampaigns(res.data?.campaigns || []);
      setTotalCount(res.data?.total || 0);
    } catch (err: any) {
      setError(err?.message || 'Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const res = await campaignsApi<{ data: NotificationTemplate[] }>('/templates');
      setTemplates(res.data || []);
    } catch (err) {
      console.error('Failed to load templates for selector', err);
    }
  };

  useEffect(() => {
    void loadCampaigns();
  }, [page, pageSize]);

  useEffect(() => {
    void loadTemplates();
  }, []);

  const closeForm = () => {
    setFormOpen(false);
    setForm(emptyCampaignForm);
    setFormError(null);
    setPreviewSize(null);
  };

  const startCreate = () => {
    setForm(emptyCampaignForm);
    setFormError(null);
    setPreviewSize(null);
    setFormOpen(true);
  };

  const selectedTemplate = useMemo(() => {
    return templates.find((t) => t._id === form.templateId) || null;
  }, [templates, form.templateId]);

  // Sync template parameters into composer fields
  useEffect(() => {
    if (selectedTemplate) {
      const emptyPlaceholders: Record<string, string> = {};
      selectedTemplate.placeholders.forEach((p) => {
        emptyPlaceholders[p] = '';
      });
      setForm((prev) => ({
        ...prev,
        title: selectedTemplate.title,
        body: selectedTemplate.body,
        imageUrl: selectedTemplate.imageUrl || '',
        deepLink: selectedTemplate.deepLink || '',
        audienceRole: selectedTemplate.audience === 'both' ? 'all' : selectedTemplate.audience === 'customers' ? 'poster' : 'tasker',
        placeholders: emptyPlaceholders,
      }));
    }
    setPreviewSize(null);
  }, [form.templateId, selectedTemplate]);

  // Construct active filters mapping from composer options
  const buildFiltersPayload = () => {
    return {
      role: form.audienceRole === 'all' ? undefined : form.audienceRole,
      city: form.audienceCity.trim() || undefined,
      status: form.audienceStatus === 'all' ? undefined : form.audienceStatus,
      isAadhaarVerified: form.isAadhaarVerified === 'all' ? undefined : form.isAadhaarVerified === 'true',
      isCertified: form.isCertified === 'all' ? undefined : form.isCertified === 'true',
      category: selectedTemplate?.category || 'promotions',
    };
  };

  // Helper to substitute placeholders `{{tag}}` with user values
  const getSubstitutedText = (text: string) => {
    let output = text;
    Object.entries(form.placeholders).forEach(([key, val]) => {
      output = output.replace(new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g'), val || `{{${key}}}`);
    });
    return output;
  };

  const substitutedTitle = useMemo(() => getSubstitutedText(form.title), [form.title, form.placeholders]);
  const substitutedBody = useMemo(() => getSubstitutedText(form.body), [form.body, form.placeholders]);

  const onPreviewAudience = async () => {
    setPreviewLoading(true);
    setFormError(null);
    try {
      const filters = buildFiltersPayload();
      const res = await campaignsApi<{ data: { matchedCount: number } }>('/campaigns/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filters }),
      });
      setPreviewSize(res.data?.matchedCount ?? 0);
    } catch (err: any) {
      setFormError(err?.message || 'Audience preview failed');
    } finally {
      setPreviewLoading(false);
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const filters = buildFiltersPayload();
    if (previewSize === null) {
      setFormError('Please preview and verify the target audience size before sending.');
      return;
    }

    const confirmSend = window.confirm(
      `Are you sure you want to send/schedule this campaign to approximately ${previewSize} user(s)?`
    );
    if (!confirmSend) return;

    const payload = {
      title: substitutedTitle,
      body: substitutedBody,
      imageUrl: form.imageUrl.trim() || undefined,
      deepLink: form.deepLink.trim() || undefined,
      templateId: form.templateId || undefined,
      audienceFilter: filters,
      scheduledAt: form.scheduledLater && form.scheduledAt ? new Date(form.scheduledAt).toISOString() : undefined,
    };

    setSaving(true);
    try {
      await campaignsApi('/campaigns', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      closeForm();
      setPage(1);
      await loadCampaigns();
    } catch (err: any) {
      setFormError(err?.message || 'Failed to dispatch campaign');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="panel">
      <div className="mgmt-page-head">
        <div>
          <h1 className="mgmt-title">Push Campaigns</h1>
          <p className="mgmt-subtitle muted">
            Compose and launch targeted bulk notifications or schedule campaigns.
          </p>
        </div>
        <div className="action-group">
          <button className="btn btn-primary" type="button" onClick={startCreate}>
            Launch campaign
          </button>
        </div>
      </div>

      {error ? <p className="error-banner">{error}</p> : null}

      {loading ? (
        <p className="muted text-center">Loading campaign statistics...</p>
      ) : campaigns.length === 0 ? (
        <div className="empty-state">
          <p className="muted">No campaign history found. Create your first campaign launch!</p>
        </div>
      ) : (
        <>
          <div className="table-wrap">
            <table className="mgmt-table">
              <thead>
                <tr>
                  <th>Campaign Details</th>
                  <th>Target Filters</th>
                  <th>Audience Size</th>
                  <th>Delivery Stats</th>
                  <th>Status</th>
                  <th>Scheduled / Created</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => (
                  <tr key={c._id}>
                    <td>
                      <strong>{c.title}</strong>
                      <div className="muted small text-ellipsis" style={{ maxWidth: '280px' }}>
                        {c.body}
                      </div>
                      {c.deepLink && (
                        <div className="small text-secondary">
                          Link: <code>{c.deepLink}</code>
                        </div>
                      )}
                    </td>
                    <td className="small">
                      <div>Role: <span className="bold">{c.audienceFilter.role || 'all'}</span></div>
                      {c.audienceFilter.city && <div>City: {c.audienceFilter.city}</div>}
                      {c.audienceFilter.status && <div>Account: {c.audienceFilter.status}</div>}
                    </td>
                    <td className="num">{c.audienceSize}</td>
                    <td className="small">
                      <span className="text-success bold">Sent: {c.sentCount}</span>
                      <br />
                      <span className="text-error bold">Failed: {c.failedCount}</span>
                    </td>
                    <td>
                      <span className={`pill ${c.status === 'COMPLETED' ? 'pill-exists' : c.status === 'SENDING' ? 'pill-new' : 'pill-decide'}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="small muted">
                      {c.scheduledAt ? (
                        <div>
                          Scheduled: <span className="bold text-secondary">{new Date(c.scheduledAt).toLocaleString()}</span>
                        </div>
                      ) : (
                        'Immediate Send'
                      )}
                      <div className="tiny">Created: {new Date(c.createdAt).toLocaleString()}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <PaginationControls
            page={page}
            totalItems={totalCount}
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
            className="modal modal-lg"
            role="dialog"
            aria-modal="true"
            aria-labelledby="campaign-form-title"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '800px' }}
          >
            <div className="modal-head">
              <h2 id="campaign-form-title">Compose &amp; Launch Campaign</h2>
              <button className="btn btn-ghost btn-sm" type="button" onClick={closeForm}>
                Close
              </button>
            </div>

            <form className="coupon-form" onSubmit={onSubmit}>
              <div className="form-grid">
                <label>
                  Start from Template (Optional)
                  <select
                    value={form.templateId}
                    onChange={(e) => setForm({ ...form, templateId: e.target.value })}
                  >
                    <option value="">-- Ad-hoc blank notification --</option>
                    {templates.map((t) => (
                      <option key={t._id} value={t._id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Preference Category
                  <select disabled={!!selectedTemplate}>
                    <option>{selectedTemplate?.category || 'promotions'}</option>
                  </select>
                </label>
              </div>

              <div className="composer-preview-split" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', margin: '15px 0' }}>
                <div className="composer-column">
                  <h3 className="section-title small">Composition</h3>
                  <label className="full-width-field">
                    Message Title
                    <input
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      placeholder="Title text"
                      disabled={!!selectedTemplate}
                      required
                    />
                  </label>

                  <label className="full-width-field">
                    Message Body
                    <textarea
                      rows={3}
                      value={form.body}
                      onChange={(e) => setForm({ ...form, body: e.target.value })}
                      placeholder="Body message text"
                      disabled={!!selectedTemplate}
                      required
                    />
                  </label>

                  {selectedTemplate && selectedTemplate.placeholders.length > 0 && (
                    <div className="placeholders-inputs" style={{ padding: '10px', background: 'var(--paper-sunk)', borderRadius: '6px', marginBottom: '12px' }}>
                      <h4 className="small bold">Placeholder Values</h4>
                      {selectedTemplate.placeholders.map((p) => (
                        <label key={p} className="small full-width-field" style={{ margin: '5px 0' }}>
                          {`{{${p}}}`} value:
                          <input
                            type="text"
                            value={form.placeholders[p] || ''}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                placeholders: { ...form.placeholders, [p]: e.target.value },
                              })
                            }
                            required
                          />
                        </label>
                      ))}
                    </div>
                  )}

                  <div className="form-grid">
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      Image (Upload local file)
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={!!selectedTemplate || uploadingImage}
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
                      Redirect Deep Link
                      <input
                        value={form.deepLink}
                        onChange={(e) => setForm({ ...form, deepLink: e.target.value })}
                        placeholder="coupons"
                        disabled={!!selectedTemplate}
                      />
                    </label>
                  </div>
                </div>

                <div className="live-preview-column" style={{ padding: '15px', border: '1px solid var(--line)', borderRadius: '8px', background: 'var(--paper-raised)' }}>
                  <h3 className="section-title small text-secondary">Live Device Notification Mockup</h3>
                  <div className="phone-mockup" style={{ border: '2px solid #aaa', borderRadius: '15px', padding: '15px', minHeight: '140px', background: '#000', color: '#fff', marginTop: '10px' }}>
                    <div className="phone-header" style={{ fontSize: '10px', color: '#888', display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span>🔔 ExtraHand</span>
                      <span>now</span>
                    </div>
                    <div className="phone-title" style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '3px' }}>
                      {substitutedTitle || 'Notification Title'}
                    </div>
                    <div className="phone-body" style={{ fontSize: '12.5px', color: '#ddd' }}>
                      {substitutedBody || 'Notification body text will be rendered here with dynamic placeholders replaced.'}
                    </div>
                    {form.imageUrl && (
                      <img 
                        src={form.imageUrl} 
                        alt="Notification banner" 
                        style={{ width: '100%', maxHeight: '100px', objectFit: 'cover', borderRadius: '4px', marginTop: '8px', border: '1px solid #333' }} 
                      />
                    )}
                  </div>
                </div>
              </div>

              <h3 className="section-title small">Target Audience Filter Rules</h3>
              <div className="form-grid">
                <label>
                  Target Role
                  <select
                    value={form.audienceRole}
                    onChange={(e) =>
                      setForm({ ...form, audienceRole: e.target.value as CampaignFormState['audienceRole'] })
                    }
                    disabled={!!selectedTemplate && selectedTemplate.audience !== 'both'}
                  >
                    <option value="poster">Customers (Posters)</option>
                    <option value="tasker">Helpers (Taskers)</option>
                    <option value="partner">Partners (Supply)</option>
                    <option value="all">All audiences</option>
                  </select>
                </label>

                <label>
                  City filter
                  <input
                    value={form.audienceCity}
                    onChange={(e) => setForm({ ...form, audienceCity: e.target.value })}
                    placeholder="Hyderabad"
                  />
                </label>

                <label>
                  Aadhaar Verification
                  <select
                    value={form.isAadhaarVerified}
                    onChange={(e) =>
                      setForm({ ...form, isAadhaarVerified: e.target.value as CampaignFormState['isAadhaarVerified'] })
                    }
                  >
                    <option value="all">All states</option>
                    <option value="true">Verified only</option>
                    <option value="false">Unverified only</option>
                  </select>
                </label>

                <label>
                  Tasker Certification
                  <select
                    value={form.isCertified}
                    onChange={(e) =>
                      setForm({ ...form, isCertified: e.target.value as CampaignFormState['isCertified'] })
                    }
                  >
                    <option value="all">All states</option>
                    <option value="true">Certified only</option>
                    <option value="false">Uncertified only</option>
                  </select>
                </label>
              </div>

              <div className="preview-action-row" style={{ display: 'flex', alignItems: 'center', gap: '15px', margin: '20px 0', padding: '10px', background: 'var(--paper-sunk)', borderRadius: '8px' }}>
                <button className="btn btn-secondary btn-sm" type="button" onClick={onPreviewAudience} disabled={previewLoading}>
                  {previewLoading ? 'Counting...' : 'Preview Target Audience Count'}
                </button>
                {previewSize !== null && (
                  <span className="audience-indicator bold text-success">
                    🎯 Approximately {previewSize} matched recipient(s) will be targeted.
                  </span>
                )}
              </div>

              <h3 className="section-title small">Campaign Dispatch Date</h3>
              <div className="check-row">
                <label className="check-item">
                  <input
                    type="checkbox"
                    checked={!form.scheduledLater}
                    onChange={(e) => setForm({ ...form, scheduledLater: !e.target.checked })}
                  />
                  Send Immediately
                </label>
                <label className="check-item">
                  <input
                    type="checkbox"
                    checked={form.scheduledLater}
                    onChange={(e) => setForm({ ...form, scheduledLater: e.target.checked })}
                  />
                  Schedule for future time
                </label>
              </div>

              {form.scheduledLater && (
                <label className="full-width-field" style={{ maxWidth: '280px', marginTop: '10px' }}>
                  Execution Date and Time
                  <input
                    type="datetime-local"
                    value={form.scheduledAt}
                    onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
                    required
                  />
                </label>
              )}

              {formError ? <p className="error">{formError}</p> : null}

              <div className="form-actions">
                <button className="btn btn-primary" type="submit" disabled={saving || previewSize === null}>
                  {saving ? 'Queueing...' : form.scheduledLater ? 'Schedule Campaign' : 'Send Campaign Now'}
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
