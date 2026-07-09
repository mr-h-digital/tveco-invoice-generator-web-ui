import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import type { ExportJob } from '../types/exportJob';
import { clientPortalService } from '../services/clientPortalService';

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
  const [jobs, setJobs] = useState<ExportJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingForJob, setUploadingForJob] = useState<string | null>(null);
  const [request, setRequest] = useState({
    destinationCountry: '',
    vehicleDescription: '',
    projectValue: '',
    estimatedDepartureDate: '',
    estimatedArrivalDate: '',
    notes: '',
  });

  const activeJobs = useMemo(() => jobs.filter((j) => j.status !== 'DELIVERED' && j.status !== 'CANCELLED').length, [jobs]);

  async function loadJobs() {
    setLoading(true);
    try {
      const data = await clientPortalService.getMyJobs();
      setJobs(data);
    } catch {
      toast.error('Could not load your export jobs');
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
      const created = await clientPortalService.submitRequest({
        destinationCountry: request.destinationCountry,
        vehicleDescription: request.vehicleDescription,
        projectValue,
        estimatedDepartureDate: request.estimatedDepartureDate || undefined,
        estimatedArrivalDate: request.estimatedArrivalDate || undefined,
        notes: request.notes || undefined,
      });
      setJobs((prev) => [created, ...prev]);
      setRequest({ destinationCountry: '', vehicleDescription: '', projectValue: '', estimatedDepartureDate: '', estimatedArrivalDate: '', notes: '' });
      toast.success('Export request submitted');
    } catch {
      toast.error('Could not submit export request');
    } finally {
      setSubmitting(false);
    }
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
          <p style={{ margin: 0, color: '#8A99AE', fontFamily: "'Space Grotesk', sans-serif", letterSpacing: 2, textTransform: 'uppercase', fontSize: 11 }}>
            TVECO Client Zone
          </p>
          <h1 style={{ margin: '6px 0 8px', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: 2, fontWeight: 400, fontSize: 42 }}>
            Track Your Export Jobs
          </h1>
          <p style={{ margin: 0, color: '#B9C4D1', fontFamily: "'Outfit', sans-serif" }}>
            Active jobs: {activeJobs} of {jobs.length}. Submit new requests and upload documents directly from this portal.
          </p>
        </header>

        <section style={{ border: '1px solid #252B35', borderRadius: 16, background: '#111318', padding: 20 }}>
          <h2 style={{ marginTop: 0, marginBottom: 12, fontFamily: "'Space Grotesk', sans-serif", fontSize: 18 }}>Submit New Export Request</h2>
          <form onSubmit={submitRequest} style={{ display: 'grid', gap: 10 }}>
            <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
              <input required placeholder="Destination Country" value={request.destinationCountry} onChange={(e) => setRequest((p) => ({ ...p, destinationCountry: e.target.value }))} style={fieldStyle} />
              <input required placeholder="Vehicle Description" value={request.vehicleDescription} onChange={(e) => setRequest((p) => ({ ...p, vehicleDescription: e.target.value }))} style={fieldStyle} />
              <input required type="number" min="0.01" step="0.01" placeholder="Project Value (ZAR)" value={request.projectValue} onChange={(e) => setRequest((p) => ({ ...p, projectValue: e.target.value }))} style={fieldStyle} />
              <input type="date" value={request.estimatedDepartureDate} onChange={(e) => setRequest((p) => ({ ...p, estimatedDepartureDate: e.target.value }))} style={fieldStyle} />
              <input type="date" value={request.estimatedArrivalDate} onChange={(e) => setRequest((p) => ({ ...p, estimatedArrivalDate: e.target.value }))} style={fieldStyle} />
            </div>
            <textarea placeholder="Additional notes" value={request.notes} onChange={(e) => setRequest((p) => ({ ...p, notes: e.target.value }))} style={{ ...fieldStyle, minHeight: 90, resize: 'vertical' }} />
            <button type="submit" disabled={submitting} style={buttonStyle(submitting)}>
              {submitting ? 'Submitting...' : 'Submit Export Request'}
            </button>
          </form>
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
