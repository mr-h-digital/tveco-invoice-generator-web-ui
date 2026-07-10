import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import type { ExportJob } from '../types/exportJob';
import type { ExportInquiry } from '../types/exportInquiry';
import type { Quote } from '../types/quote';
import { clientPortalService } from '../services/clientPortalService';
import { useAuthStore } from '../store/authStore';

function currency(value: number) {
  return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(value || 0);
}

function toDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function ClientPortalPage() {
  const { user, logout } = useAuthStore();
  const [jobs, setJobs] = useState<ExportJob[]>([]);
  const [inquiries, setInquiries] = useState<ExportInquiry[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [replyingInquiryId, setReplyingInquiryId] = useState<string | null>(null);
  const [uploadingForJob, setUploadingForJob] = useState<string | null>(null);
  const [request, setRequest] = useState({
    inquiryType: 'REQUEST' as 'INQUIRY' | 'REQUEST',
    destinationCountry: '',
    vehicleDescription: '',
    projectValue: '',
    estimatedDepartureDate: '',
    estimatedArrivalDate: '',
    notes: '',
  });
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});

  async function loadJobs() {
    setLoading(true);
    try {
      const [jobData, inquiryData, quoteData] = await Promise.all([
        clientPortalService.getMyJobs(),
        clientPortalService.getMyInquiries(),
        clientPortalService.getMyQuotes(),
      ]);
      setJobs(jobData);
      setInquiries(inquiryData);
      setQuotes(quoteData);
    } catch {
      toast.error('Could not load your client portal data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadJobs();
  }, []);

  async function submitRequest(e: React.FormEvent) {
    e.preventDefault();
    const projectValue = Number(request.projectValue);
    if (!Number.isFinite(projectValue) || projectValue <= 0) {
      toast.error('Project value must be greater than 0');
      return;
    }

    setSubmitting(true);
    try {
      const created = await clientPortalService.submitInquiry({
        inquiryType: request.inquiryType,
        destinationCountry: request.destinationCountry,
        vehicleDescription: request.vehicleDescription,
        projectValue,
        estimatedDepartureDate: request.estimatedDepartureDate || undefined,
        estimatedArrivalDate: request.estimatedArrivalDate || undefined,
        notes: request.notes || undefined,
      });
      setInquiries((prev) => [created, ...prev]);
      setRequest({ inquiryType: 'REQUEST', destinationCountry: '', vehicleDescription: '', projectValue: '', estimatedDepartureDate: '', estimatedArrivalDate: '', notes: '' });
      toast.success('Export inquiry submitted');
    } catch {
      toast.error('Could not submit export inquiry');
    } finally {
      setSubmitting(false);
    }
  }

  async function respondToInquiry(inquiryId: string) {
    const message = (replyDrafts[inquiryId] ?? '').trim();
    if (!message) {
      toast.error('Response cannot be empty');
      return;
    }

    setReplyingInquiryId(inquiryId);
    try {
      const updated = await clientPortalService.respondToInquiry(inquiryId, message);
      setInquiries((prev) => prev.map((inquiry) => (inquiry.id === updated.id ? updated : inquiry)));
      setReplyDrafts((prev) => ({ ...prev, [inquiryId]: '' }));
      toast.success('Response sent to operations team');
    } catch {
      toast.error('Could not send response');
    } finally {
      setReplyingInquiryId(null);
    }
  }

  async function decideQuote(quoteId: string, status: 'ACCEPTED' | 'DECLINED') {
    try {
      const updated = await clientPortalService.decideQuote(quoteId, status);
      setQuotes((prev) => prev.map((quote) => (quote.id === updated.id ? updated : quote)));
      toast.success(status === 'ACCEPTED' ? 'Quote accepted' : 'Quote declined');
    } catch {
      toast.error('Could not submit quote decision');
    }
  }

  async function handleLogout() {
    await logout();
    toast.success('Signed out');
  }

  async function handleUpload(jobId: string, file: File | null) {
    if (!file) return;
    setUploadingForJob(jobId);
    try {
      const dataUrl = await toDataUrl(file);
      const updated = await clientPortalService.uploadDocument(jobId, {
        name: file.name,
        mimeType: file.type || 'application/octet-stream',
        sizeBytes: file.size,
        category: 'General',
        dataUrl,
      });
      setJobs((prev) => prev.map((job) => (job.id === jobId ? updated : job)));
      toast.success('Document uploaded');
    } catch {
      toast.error('Could not upload document');
    } finally {
      setUploadingForJob(null);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0A0C0F', color: '#F0F4F8', padding: '20px' }}>
      <div style={{ maxWidth: 1120, margin: '0 auto', display: 'grid', gap: 20 }}>
        <header style={{ border: '1px solid #252B35', borderRadius: 16, background: '#111318', padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <p style={{ margin: 0, color: '#8A99AE', fontFamily: "'Space Grotesk', sans-serif", letterSpacing: 2, textTransform: 'uppercase', fontSize: 11 }}>
                TVECO Client Zone
              </p>
              <h1 style={{ margin: '6px 0 8px', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: 2, fontWeight: 400, fontSize: 42 }}>
                Your TVECO Client Portal
              </h1>
              <p style={{ margin: 0, color: '#B9C4D1', fontFamily: "'Outfit', sans-serif" }}>
                Submit export inquiries, respond to clarification requests, review and decide on formal quotes, and track your active export jobs — all from one place.
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, paddingTop: 4 }}>
              {user?.email ? (
                <p style={{ margin: 0, color: '#8A99AE', fontFamily: "'Outfit', sans-serif", fontSize: 13 }}>{user.email}</p>
              ) : null}
              <button
                type="button"
                onClick={() => void handleLogout()}
                style={{ background: 'transparent', border: '1px solid #303949', borderRadius: 8, padding: '8px 16px', color: '#B9C4D1', fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, cursor: 'pointer' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#EF4444'; e.currentTarget.style.color = '#EF4444'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#303949'; e.currentTarget.style.color = '#B9C4D1'; }}
              >
                Sign out
              </button>
            </div>
          </div>
        </header>

        <section style={{ border: '1px solid #252B35', borderRadius: 16, background: '#111318', padding: 20 }}>
          <h2 style={{ marginTop: 0, marginBottom: 12, fontFamily: "'Space Grotesk', sans-serif", fontSize: 18 }}>Submit Export Inquiry / Request</h2>
          <form onSubmit={submitRequest} style={{ display: 'grid', gap: 10 }}>
            <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
              <select value={request.inquiryType} onChange={(e) => setRequest((p) => ({ ...p, inquiryType: e.target.value as 'INQUIRY' | 'REQUEST' }))} style={fieldStyle}>
                <option value="INQUIRY">Inquiry</option>
                <option value="REQUEST">Request</option>
              </select>
              <input required placeholder="Destination Country" value={request.destinationCountry} onChange={(e) => setRequest((p) => ({ ...p, destinationCountry: e.target.value }))} style={fieldStyle} />
              <input required placeholder="Vehicle Description" value={request.vehicleDescription} onChange={(e) => setRequest((p) => ({ ...p, vehicleDescription: e.target.value }))} style={fieldStyle} />
              <input required type="number" min="0.01" step="0.01" placeholder="Project Value (ZAR)" value={request.projectValue} onChange={(e) => setRequest((p) => ({ ...p, projectValue: e.target.value }))} style={fieldStyle} />
              <input type="date" value={request.estimatedDepartureDate} onChange={(e) => setRequest((p) => ({ ...p, estimatedDepartureDate: e.target.value }))} style={fieldStyle} />
              <input type="date" value={request.estimatedArrivalDate} onChange={(e) => setRequest((p) => ({ ...p, estimatedArrivalDate: e.target.value }))} style={fieldStyle} />
            </div>
            <textarea placeholder="Additional notes" value={request.notes} onChange={(e) => setRequest((p) => ({ ...p, notes: e.target.value }))} style={{ ...fieldStyle, minHeight: 90, resize: 'vertical' }} />
            <button type="submit" disabled={submitting} style={buttonStyle(submitting)}>
              {submitting ? 'Submitting...' : 'Submit Inquiry'}
            </button>
          </form>
        </section>

        <section style={{ display: 'grid', gap: 12 }}>
          <h2 style={{ margin: 0, fontFamily: "'Space Grotesk', sans-serif", fontSize: 18 }}>My Inquiries</h2>
          {!loading && inquiries.length === 0 ? <div style={{ color: '#8A99AE' }}>No inquiries yet. Submit your first inquiry above.</div> : null}
          {inquiries.map((inquiry) => (
            <article key={inquiry.id} style={{ border: '1px solid #252B35', borderRadius: 14, background: '#111318', padding: 16, display: 'grid', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <div>
                  <h3 style={{ margin: 0, fontFamily: "'Space Grotesk', sans-serif", fontSize: 16 }}>{inquiry.inquiryNumber}</h3>
                  <p style={{ margin: '4px 0 0', color: '#B9C4D1', fontSize: 13 }}>{inquiry.vehicleDescription} to {inquiry.destinationCountry}</p>
                </div>
                <span style={{ border: '1px solid #3A4454', borderRadius: 999, padding: '4px 10px', fontSize: 12, color: '#D3DCE8' }}>{inquiry.status}</span>
              </div>

              <div style={{ display: 'grid', gap: 6 }}>
                {inquiry.messages.map((msg) => (
                  <div key={msg.id} style={{ borderTop: '1px dashed #252B35', paddingTop: 6, fontSize: 13, color: '#C7D2DF' }}>
                    <strong>{msg.senderRole}</strong>: {msg.message}
                    <div style={{ color: '#8A99AE', fontSize: 12 }}>{new Date(msg.createdAt).toLocaleString()}</div>
                    {msg.requiresClientResponse && !msg.clientResponded ? (
                      <div style={{ color: '#FBBF24', fontSize: 12 }}>Operations is waiting for your response.</div>
                    ) : null}
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gap: 8 }}>
                <textarea
                  value={replyDrafts[inquiry.id] ?? ''}
                  onChange={(e) => setReplyDrafts((prev) => ({ ...prev, [inquiry.id]: e.target.value }))}
                  placeholder="Reply to operations requests for more detail..."
                  style={{ ...fieldStyle, minHeight: 70, resize: 'vertical' }}
                />
                <button
                  type="button"
                  disabled={replyingInquiryId === inquiry.id}
                  onClick={() => void respondToInquiry(inquiry.id)}
                  style={buttonStyle(replyingInquiryId === inquiry.id)}
                >
                  {replyingInquiryId === inquiry.id ? 'Sending...' : 'Send Response'}
                </button>
              </div>
            </article>
          ))}
        </section>

        <section style={{ display: 'grid', gap: 12 }}>
          <h2 style={{ margin: 0, fontFamily: "'Space Grotesk', sans-serif", fontSize: 18 }}>My Quotes</h2>
          {!loading && quotes.length === 0 ? <div style={{ color: '#8A99AE' }}>No quotes available yet.</div> : null}
          {quotes.map((quote) => (
            <article key={quote.id} style={{ border: '1px solid #252B35', borderRadius: 14, background: '#111318', padding: 16, display: 'grid', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <strong style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{quote.quoteNumber}</strong>
                <span style={{ border: '1px solid #3A4454', borderRadius: 999, padding: '4px 10px', fontSize: 12, color: '#D3DCE8' }}>{quote.status}</span>
              </div>
              <div style={{ color: '#B9C4D1', fontSize: 13 }}>
                Total: {currency(quote.total)} • Expires: {new Date(quote.expiryDate).toLocaleDateString()}
              </div>
              {quote.status === 'SENT' ? (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button type="button" onClick={() => void decideQuote(quote.id, 'ACCEPTED')} style={buttonStyle(false)}>
                    Accept Quote
                  </button>
                  <button type="button" onClick={() => void decideQuote(quote.id, 'DECLINED')} style={{ ...buttonStyle(false), background: '#7A2E2E' }}>
                    Decline Quote
                  </button>
                </div>
              ) : null}
            </article>
          ))}
        </section>

        <section style={{ display: 'grid', gap: 12 }}>
          <h2 style={{ margin: 0, fontFamily: "'Space Grotesk', sans-serif", fontSize: 18 }}>My Export Jobs</h2>
          {loading ? <div style={{ color: '#8A99AE' }}>Loading jobs...</div> : null}
          {!loading && jobs.length === 0 ? <div style={{ color: '#8A99AE' }}>No jobs yet. Submit your first request above.</div> : null}
          {jobs.map((job) => (
            <article key={job.id} style={{ border: '1px solid #252B35', borderRadius: 14, background: '#111318', padding: 16 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: 0, fontFamily: "'Space Grotesk', sans-serif", fontSize: 16 }}>{job.jobNumber}</h3>
                  <p style={{ margin: '4px 0 0', color: '#B9C4D1', fontSize: 13 }}>{job.vehicleDescription} to {job.destinationCountry}</p>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <span style={{ border: '1px solid #3A4454', borderRadius: 999, padding: '4px 10px', fontSize: 12, color: '#D3DCE8' }}>{job.status}</span>
                  <Link to={`/track/${job.publicTrackingToken}`} style={{ color: '#FF6B00', textDecoration: 'none', fontSize: 13 }}>Public tracking view</Link>
                </div>
              </div>

              <div style={{ marginTop: 12, display: 'grid', gap: 6, gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', color: '#B9C4D1', fontSize: 13 }}>
                <div>Project Value: {currency(job.projectValue)}</div>
                <div>Updated: {new Date(job.updatedAt).toLocaleString()}</div>
                <div>Payment Milestones: {job.paymentMilestones.length}</div>
                <div>Vault Documents: {job.vaultDocuments.length}</div>
              </div>

              <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
                <strong style={{ fontSize: 13 }}>Progress</strong>
                {job.milestones.map((m) => (
                  <div key={m.key} style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #252B35', paddingTop: 6, fontSize: 13, color: '#C7D2DF' }}>
                    <span>{m.label}</span>
                    <span>{m.completedAt ? new Date(m.completedAt).toLocaleDateString() : 'Pending'}</span>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: '1px solid #303949', borderRadius: 8, padding: '8px 10px', cursor: uploadingForJob === job.id ? 'not-allowed' : 'pointer' }}>
                  <span style={{ fontSize: 12 }}>Upload Document</span>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    disabled={uploadingForJob === job.id}
                    onChange={(e) => {
                      const file = e.target.files?.[0] ?? null;
                      void handleUpload(job.id, file);
                      e.currentTarget.value = '';
                    }}
                    style={{ display: 'none' }}
                  />
                </label>
                {uploadingForJob === job.id ? <span style={{ fontSize: 12, color: '#8A99AE' }}>Uploading...</span> : null}
              </div>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}

const fieldStyle: React.CSSProperties = {
  width: '100%',
  background: '#0A0C0F',
  border: '1px solid #252B35',
  borderRadius: 8,
  padding: '10px 12px',
  color: '#F0F4F8',
  fontFamily: "'Outfit', sans-serif",
  boxSizing: 'border-box',
};

function buttonStyle(disabled: boolean): React.CSSProperties {
  return {
    border: 'none',
    borderRadius: 10,
    padding: '11px 14px',
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 700,
    background: '#FF6B00',
    color: '#fff',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.8 : 1,
  };
}
