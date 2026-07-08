import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Search, Truck, CheckCircle2, Circle, Download } from 'lucide-react';
import { toast } from 'sonner';
import { useExportJobs } from '../hooks/useExportJobs';
import { formatDate, formatDateShort } from '../utils/formatDate';
import { formatCurrency } from '../utils/formatCurrency';
import { PageBackground } from '../components/layout/PageBackground';
import invoicesBg from '../assets/tveco-invoices-bg.jpg';
import { documentVaultStorageService } from '../services/documentVaultStorageService';

export function PublicTrackingPage() {
  const params = useParams();
  const { jobs } = useExportJobs();
  const [inputToken, setInputToken] = useState((params.token ?? '').toUpperCase());

  const token = (params.token ?? '').toUpperCase();
  const job = useMemo(() => jobs.find((j) => j.publicTrackingToken.toUpperCase() === token) ?? null, [jobs, token]);

  const paidTotal = job ? job.paymentMilestones.filter((m) => m.paid).reduce((sum, m) => sum + m.amount, 0) : 0;
  const visibleVaultDocuments = job ? job.vaultDocuments.filter((d) => d.visibleToClient) : [];

  async function handleDownloadDocument(doc: NonNullable<typeof job>['vaultDocuments'][number]) {
    const url = await documentVaultStorageService.resolveDownloadUrl(doc);
    if (!url) {
      toast.error('Download link is not available right now. Please contact TVECO support.');
      return;
    }

    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = doc.name;
    anchor.rel = 'noopener';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  }

  return (
    <PageBackground image={invoicesBg} position="center 25%">
      <div className="min-h-screen flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-3xl bg-brand-card border border-brand-border rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-brand-border flex items-center justify-between gap-3">
            <div>
              <h1 className="font-display text-brand-white text-xl tracking-wide">TVECO Tracking Portal</h1>
              <p className="text-brand-muted text-xs">Track your export journey in real time</p>
            </div>
            <Link to="/login" className="text-xs text-brand-muted hover:text-brand-white transition-colors">Back to login</Link>
          </div>

          <div className="p-5 border-b border-brand-border">
            <label className="block text-xs text-brand-muted mb-1">Tracking Token</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
                <input
                  value={inputToken}
                  onChange={(e) => setInputToken(e.target.value.toUpperCase())}
                  className="input-field pl-9 text-sm"
                  placeholder="Enter token e.g. TVC-9A1F0C"
                />
              </div>
              <Link
                to={`/track/${encodeURIComponent(inputToken.trim())}`}
                className="px-4 py-2 rounded-lg text-sm text-white hover:opacity-90 transition-opacity"
                style={{ background: '#FF6B00' }}
              >
                Track
              </Link>
            </div>
          </div>

          {!token ? (
            <div className="p-6 text-sm text-brand-muted">Enter a tracking token to view export progress.</div>
          ) : !job ? (
            <div className="p-6 text-sm text-brand-muted">No export job found for token {token}. Please verify the token and try again.</div>
          ) : (
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-xl border border-brand-border p-3 bg-brand-card2">
                  <p className="text-xs text-brand-muted">Job Number</p>
                  <p className="text-sm text-brand-white font-medium">{job.jobNumber}</p>
                </div>
                <div className="rounded-xl border border-brand-border p-3 bg-brand-card2">
                  <p className="text-xs text-brand-muted">Destination</p>
                  <p className="text-sm text-brand-white font-medium">{job.destinationCountry}</p>
                </div>
                <div className="rounded-xl border border-brand-border p-3 bg-brand-card2">
                  <p className="text-xs text-brand-muted">Vehicle</p>
                  <p className="text-sm text-brand-white font-medium">{job.vehicleDescription}</p>
                </div>
                <div className="rounded-xl border border-brand-border p-3 bg-brand-card2">
                  <p className="text-xs text-brand-muted">Estimated Arrival</p>
                  <p className="text-sm text-brand-white font-medium">{formatDate(job.estimatedArrivalDate)}</p>
                </div>
              </div>

              <div className="rounded-xl border border-brand-border p-4">
                <div className="flex items-center gap-2 mb-2 text-brand-white">
                  <Truck size={16} />
                  <p className="text-sm font-medium">Journey Timeline</p>
                </div>
                <div className="space-y-2">
                  {job.milestones.map((m) => (
                    <div key={m.key} className="flex items-center justify-between gap-2 text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        {m.completedAt ? (
                          <CheckCircle2 size={14} style={{ color: '#22C55E' }} />
                        ) : (
                          <Circle size={14} className="text-brand-muted" />
                        )}
                        <span className="text-brand-text truncate">{m.label}</span>
                      </div>
                      <span className="text-xs text-brand-muted">{m.completedAt ? formatDateShort(m.completedAt.split('T')[0]) : 'Pending'}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-brand-border p-4">
                <p className="text-sm text-brand-white font-medium mb-2">Payment Progress</p>
                <div className="space-y-2">
                  {job.paymentMilestones.map((m) => (
                    <div key={m.key} className="flex items-center justify-between gap-2 text-sm">
                      <span className="text-brand-text">{m.label}</span>
                      <span className={m.paid ? 'text-green-400' : 'text-brand-muted'}>
                        {m.paid ? 'Paid' : `Due ${formatDateShort(m.dueDate)}`} · {formatCurrency(m.amount)}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-brand-muted mt-3">Paid so far: {formatCurrency(paidTotal)}</p>
              </div>

              <div className="rounded-xl border border-brand-border p-4">
                <p className="text-sm text-brand-white font-medium mb-2">Client Documents</p>
                {visibleVaultDocuments.length === 0 ? (
                  <p className="text-xs text-brand-muted">No shared documents yet. TVECO will publish files here when available.</p>
                ) : (
                  <div className="space-y-2">
                    {visibleVaultDocuments.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-brand-border bg-brand-card2">
                        <div className="min-w-0">
                          <p className="text-sm text-brand-text truncate">{doc.name}</p>
                          <p className="text-[11px] text-brand-muted">{doc.category}</p>
                        </div>
                        <button
                          onClick={() => handleDownloadDocument(doc)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-brand-border text-xs text-brand-text hover:bg-brand-card transition-colors"
                        >
                          <Download size={12} />
                          Download
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </PageBackground>
  );
}
