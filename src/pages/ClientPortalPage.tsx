import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BellRing, Clock3, FileText, LogOut, PackageCheck, Send, ShieldCheck, UserCog } from 'lucide-react';
import { toast } from 'sonner';
import type { ExportJob } from '../types/exportJob';
import type { ExportInquiry } from '../types/exportInquiry';
import type { Quote } from '../types/quote';
import tvecoLoginBg from '../assets/tveco-login-bg.jpg';
import tvecoLogo from '../assets/tveco-logo.png';
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
    estimatedDepartureDate: '',
    estimatedArrivalDate: '',
    notes: '',
  });
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});

  const welcomeName =
    user?.email?.split('@')[0]
      ?.replace(/[._-]+/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase()) ?? 'Client';

  const openInquiryCount = inquiries.filter((inquiry) => inquiry.status !== 'CLOSED' && inquiry.status !== 'CONVERTED_TO_JOB').length;
  const quoteActionCount = quotes.filter((quote) => quote.status === 'SENT').length;
  const activeJobCount = jobs.filter((job) => job.status !== 'DELIVERED' && job.status !== 'CANCELLED').length;
  const awaitingClientResponseCount = inquiries.filter((inquiry) =>
    inquiry.messages.some((message) => message.requiresClientResponse && !message.clientResponded)
  ).length;

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
    setSubmitting(true);
    try {
      const created = await clientPortalService.submitInquiry({
        inquiryType: request.inquiryType,
        destinationCountry: request.destinationCountry,
        vehicleDescription: request.vehicleDescription,
        estimatedDepartureDate: request.estimatedDepartureDate || undefined,
        estimatedArrivalDate: request.estimatedArrivalDate || undefined,
        notes: request.notes || undefined,
      });
      setInquiries((prev) => [created, ...prev]);
      setRequest({ inquiryType: 'REQUEST', destinationCountry: '', vehicleDescription: '', estimatedDepartureDate: '', estimatedArrivalDate: '', notes: '' });
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
    <div style={pageStyle}>
      <div style={pageBgImageStyle(tvecoLoginBg)} />
      <div style={pageBgOverlayStyle} />
      <div style={gridOverlayStyle} />

      <div style={pageContentStyle}>
        <header style={heroStyle}>
          <div style={heroGlowStyle} />
          <div style={heroTopRowStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={logoWrapStyle}>
                <img src={tvecoLogo} alt="TVECO" style={logoStyle} />
              </div>
              <div>
                <p style={eyebrowStyle}>TVECO Client Zone</p>
                <p style={welcomeLineStyle}>Welcome back, {welcomeName}</p>
                <h1 style={heroTitleStyle}>Your TVECO Client Portal</h1>
                <p style={heroSubtitleStyle}>
                  Submit export inquiries, respond to clarification requests, review formal quotes, and monitor active shipments from one polished workspace.
                </p>
              </div>
            </div>

            <div style={heroAsideStyle}>
              <div style={clientIdentityStyle}>
                <span style={heroChipStyle}><ShieldCheck size={13} /> Secure client session</span>
                {user?.email ? <p style={heroEmailStyle}>{user.email}</p> : null}
                <Link to="/client/profile" style={{ ...heroActionLinkStyle, marginTop: 8 }}>
                  <UserCog size={14} /> Profile settings
                </Link>
              </div>
              <button
                type="button"
                onClick={() => void handleLogout()}
                style={signOutButtonStyle}
              >
                <LogOut size={15} />
                <span>Sign out</span>
              </button>
            </div>
          </div>

          <div style={heroSummaryGridStyle}>
            <SummaryCard icon={<BellRing size={16} />} label="Open inquiries" value={openInquiryCount} accent="#FF8C35" />
            <SummaryCard icon={<Send size={16} />} label="Needs your response" value={awaitingClientResponseCount} accent="#FBBF24" />
            <SummaryCard icon={<FileText size={16} />} label="Quotes awaiting decision" value={quoteActionCount} accent="#7DD3FC" />
            <SummaryCard icon={<PackageCheck size={16} />} label="Active export jobs" value={activeJobCount} accent="#4ADE80" />
          </div>

          <nav aria-label="Client portal sections" style={portalNavStyle}>
            <a href="#inquiry-request" style={portalNavLinkStyle}>Inquiry Request</a>
            <a href="#my-inquiries" style={portalNavLinkStyle}>Inquiries</a>
            <a href="#my-quotes" style={portalNavLinkStyle}>Quotes</a>
            <a href="#my-jobs" style={portalNavLinkStyle}>Export Jobs</a>
            <a href="#my-jobs" style={portalNavLinkStyle}>Documents</a>
            <Link to="/client/profile" style={portalNavLinkStyle}>Profile</Link>
          </nav>
        </header>

        <section id="inquiry-request" style={featureGridStyle}>
          <div style={sectionCardStyle}>
            <div style={sectionHeadStyle}>
              <div>
                <p style={sectionEyebrowStyle}>Start here</p>
                <h2 style={sectionTitleStyle}>Submit Export Inquiry / Request</h2>
              </div>
              <span style={sectionPillStyle}>Pricing is confirmed by TVECO quote</span>
            </div>

            <form onSubmit={submitRequest} style={{ display: 'grid', gap: 12 }}>
              <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                <select value={request.inquiryType} onChange={(e) => setRequest((p) => ({ ...p, inquiryType: e.target.value as 'INQUIRY' | 'REQUEST' }))} style={fieldStyle}>
                  <option value="INQUIRY">Inquiry</option>
                  <option value="REQUEST">Request</option>
                </select>
                <input required placeholder="Destination Country" value={request.destinationCountry} onChange={(e) => setRequest((p) => ({ ...p, destinationCountry: e.target.value }))} style={fieldStyle} />
                <input required placeholder="Vehicle Description" value={request.vehicleDescription} onChange={(e) => setRequest((p) => ({ ...p, vehicleDescription: e.target.value }))} style={fieldStyle} />
                <input type="date" value={request.estimatedDepartureDate} onChange={(e) => setRequest((p) => ({ ...p, estimatedDepartureDate: e.target.value }))} style={fieldStyle} />
                <input type="date" value={request.estimatedArrivalDate} onChange={(e) => setRequest((p) => ({ ...p, estimatedArrivalDate: e.target.value }))} style={fieldStyle} />
              </div>
              <textarea placeholder="Additional notes" value={request.notes} onChange={(e) => setRequest((p) => ({ ...p, notes: e.target.value }))} style={{ ...fieldStyle, minHeight: 108, resize: 'vertical' }} />
              <button type="submit" disabled={submitting} style={buttonStyle(submitting)}>
                {submitting ? 'Submitting...' : 'Submit Inquiry'}
              </button>
            </form>
          </div>

          <aside style={sideGuideCardStyle}>
            <p style={sectionEyebrowStyle}>How it works</p>
            <h3 style={{ ...sectionTitleStyle, fontSize: 22, marginBottom: 8 }}>Clear flow from inquiry to export job</h3>
            <div style={{ display: 'grid', gap: 12 }}>
              {[
                'Send your destination, vehicle details, and any timing notes.',
                'Operations reviews the request and asks for clarity if needed.',
                'You receive a formal quote in this portal once pricing is ready.',
                'After acceptance, TVECO converts the quote into a live export job.',
              ].map((item, index) => (
                <div key={item} style={timelineRowStyle}>
                  <div style={timelineIndexStyle}>{index + 1}</div>
                  <p style={timelineTextStyle}>{item}</p>
                </div>
              ))}
            </div>
            <div style={guideNoteStyle}>
              <Clock3 size={16} color="#FF8C35" />
              <span>Your project value is not entered here. TVECO confirms pricing only once the quote is prepared.</span>
            </div>
          </aside>
        </section>

        <section id="my-inquiries" style={contentSectionStyle}>
          <div style={sectionHeaderBarStyle}>
            <div>
              <p style={sectionEyebrowStyle}>Conversation</p>
              <h2 style={sectionTitleStyle}>My Inquiries</h2>
            </div>
            <span style={sectionMutedMetaStyle}>{openInquiryCount} active</span>
          </div>
          {!loading && inquiries.length === 0 ? <EmptyState text="No inquiries yet. Submit your first inquiry above to start the workflow." /> : null}
          <div style={stackStyle}>
            {inquiries.map((inquiry) => (
              <article key={inquiry.id} style={itemCardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  <div>
                    <h3 style={itemTitleStyle}>{inquiry.inquiryNumber}</h3>
                    <p style={itemSubtitleStyle}>{inquiry.vehicleDescription} to {inquiry.destinationCountry}</p>
                  </div>
                  <span style={statusPillStyle}>{inquiry.status}</span>
                </div>

                <div style={{ display: 'grid', gap: 8 }}>
                  {inquiry.messages.map((msg) => (
                    <div key={msg.id} style={messageCardStyle}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                        <strong style={{ color: msg.senderRole === 'ADMIN' ? '#F0F4F8' : '#9CD3FF' }}>{msg.senderRole}</strong>
                        <span style={{ color: '#8A99AE', fontSize: 12 }}>{new Date(msg.createdAt).toLocaleString()}</span>
                      </div>
                      <p style={{ margin: '6px 0 0', color: '#C7D2DF', whiteSpace: 'pre-wrap', fontSize: 13 }}>{msg.message}</p>
                      {msg.requiresClientResponse && !msg.clientResponded ? (
                        <div style={awaitingResponseStyle}>Operations is waiting for your response.</div>
                      ) : null}
                    </div>
                  ))}
                </div>

                <div style={{ display: 'grid', gap: 8 }}>
                  <textarea
                    value={replyDrafts[inquiry.id] ?? ''}
                    onChange={(e) => setReplyDrafts((prev) => ({ ...prev, [inquiry.id]: e.target.value }))}
                    placeholder="Reply to operations requests for more detail..."
                    style={{ ...fieldStyle, minHeight: 78, resize: 'vertical' }}
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
          </div>
        </section>

        <section id="my-quotes" style={contentSectionStyle}>
          <div style={sectionHeaderBarStyle}>
            <div>
              <p style={sectionEyebrowStyle}>Commercial</p>
              <h2 style={sectionTitleStyle}>My Quotes</h2>
            </div>
            <span style={sectionMutedMetaStyle}>{quoteActionCount} awaiting action</span>
          </div>
          {!loading && quotes.length === 0 ? <EmptyState text="No quotes available yet. Once TVECO prices your request, your formal quote will appear here." /> : null}
          <div style={stackStyle}>
            {quotes.map((quote) => (
              <article key={quote.id} style={itemCardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  <strong style={itemTitleStyle}>{quote.quoteNumber}</strong>
                  <span style={statusPillStyle}>{quote.status}</span>
                </div>
                <div style={{ color: '#B9C4D1', fontSize: 13 }}>
                  Total: {currency(quote.total)} • Expires: {new Date(quote.expiryDate).toLocaleDateString()}
                </div>
                {quote.status === 'SENT' ? (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button type="button" onClick={() => void decideQuote(quote.id, 'ACCEPTED')} style={buttonStyle(false)}>
                      Accept Quote
                    </button>
                    <button type="button" onClick={() => void decideQuote(quote.id, 'DECLINED')} style={secondaryDangerButtonStyle}>
                      Decline Quote
                    </button>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </section>

        <section id="my-jobs" style={contentSectionStyle}>
          <div style={sectionHeaderBarStyle}>
            <div>
              <p style={sectionEyebrowStyle}>Fulfilment</p>
              <h2 style={sectionTitleStyle}>My Export Jobs</h2>
            </div>
            <span style={sectionMutedMetaStyle}>{activeJobCount} in progress</span>
          </div>
          {loading ? <EmptyState text="Loading jobs..." /> : null}
          {!loading && jobs.length === 0 ? <EmptyState text="No jobs yet. Once a quote is accepted and converted, your export job will appear here." /> : null}
          <div style={stackStyle}>
            {jobs.map((job) => (
              <article key={job.id} style={itemCardStyle}>
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
                  <div>
                    <h3 style={itemTitleStyle}>{job.jobNumber}</h3>
                    <p style={itemSubtitleStyle}>{job.vehicleDescription} to {job.destinationCountry}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={statusPillStyle}>{job.status}</span>
                    <Link to={`/track/${job.publicTrackingToken}`} style={inlineLinkStyle}>
                      <span>Public tracking view</span>
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>

                <div style={jobMetaGridStyle}>
                  <div style={jobMetaCardStyle}><span style={jobMetaLabelStyle}>Project value</span><strong>{currency(job.projectValue)}</strong></div>
                  <div style={jobMetaCardStyle}><span style={jobMetaLabelStyle}>Updated</span><strong>{new Date(job.updatedAt).toLocaleString()}</strong></div>
                  <div style={jobMetaCardStyle}><span style={jobMetaLabelStyle}>Payment milestones</span><strong>{job.paymentMilestones.length}</strong></div>
                  <div style={jobMetaCardStyle}><span style={jobMetaLabelStyle}>Vault documents</span><strong>{job.vaultDocuments.length}</strong></div>
                </div>

                <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
                  <strong style={{ fontSize: 13, color: '#F0F4F8', fontFamily: "'Space Grotesk', sans-serif" }}>Progress</strong>
                  {job.milestones.map((m) => (
                    <div key={m.key} style={progressRowStyle}>
                      <span>{m.label}</span>
                      <span>{m.completedAt ? new Date(m.completedAt).toLocaleDateString() : 'Pending'}</span>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                  <label style={uploadButtonWrapStyle(uploadingForJob === job.id)}>
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
          </div>
        </section>
      </div>
    </div>
  );
}

function SummaryCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: number; accent: string }) {
  return (
    <div style={summaryCardStyle(accent)}>
      <div style={summaryIconStyle(accent)}>{icon}</div>
      <div>
        <p style={summaryLabelStyle}>{label}</p>
        <p style={summaryValueStyle}>{value}</p>
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div style={emptyStateStyle}>{text}</div>;
}

const fieldStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(8, 11, 16, 0.9)',
  border: '1px solid #2C3542',
  borderRadius: 12,
  padding: '12px 14px',
  color: '#F0F4F8',
  fontSize: 16,
  fontFamily: "'Outfit', sans-serif",
  boxSizing: 'border-box',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.02)',
};

function buttonStyle(disabled: boolean): React.CSSProperties {
  return {
    border: 'none',
    borderRadius: 12,
    padding: '12px 16px',
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 700,
    background: 'linear-gradient(135deg, #FF6B00 0%, #FF8C35 100%)',
    color: '#fff',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.8 : 1,
    boxShadow: disabled ? 'none' : '0 12px 28px rgba(255,107,0,0.22)',
  };
}

const secondaryDangerButtonStyle: React.CSSProperties = {
  ...buttonStyle(false),
  background: 'rgba(122, 46, 46, 0.9)',
  boxShadow: 'none',
};

const pageStyle: React.CSSProperties = {
  minHeight: '100svh',
  background: '#0A0C0F',
  color: '#F0F4F8',
  position: 'relative',
  overflow: 'hidden',
};

const pageBgImageStyle = (image: string): React.CSSProperties => ({
  position: 'absolute',
  inset: 0,
  backgroundImage: `url(${image})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center 35%',
  opacity: 0.16,
  transform: 'scale(1.03)',
});

const pageBgOverlayStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  background: 'radial-gradient(circle at 18% 18%, rgba(255,107,0,0.18) 0%, rgba(255,107,0,0) 32%), linear-gradient(180deg, rgba(10,12,15,0.82) 0%, rgba(10,12,15,0.96) 42%, rgba(10,12,15,1) 100%)',
};

const gridOverlayStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
  backgroundSize: '42px 42px',
  opacity: 0.12,
  pointerEvents: 'none',
};

const pageContentStyle: React.CSSProperties = {
  position: 'relative',
  zIndex: 1,
  maxWidth: 1180,
  margin: '0 auto',
  padding: 'clamp(18px, 3.2vw, 32px) clamp(12px, 2.4vw, 20px) clamp(28px, 5vw, 48px)',
  display: 'grid',
  gap: 20,
};

const heroStyle: React.CSSProperties = {
  position: 'relative',
  border: '1px solid rgba(83, 96, 114, 0.34)',
  borderRadius: 28,
  background: 'linear-gradient(145deg, rgba(19,24,33,0.94) 0%, rgba(14,18,25,0.97) 100%)',
  boxShadow: '0 30px 80px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.03)',
  padding: 'clamp(16px, 2.8vw, 24px)',
  overflow: 'hidden',
};

const heroGlowStyle: React.CSSProperties = {
  position: 'absolute',
  width: 320,
  height: 320,
  right: -100,
  top: -120,
  borderRadius: '50%',
  background: 'radial-gradient(circle, rgba(255,107,0,0.18) 0%, rgba(255,107,0,0) 68%)',
  pointerEvents: 'none',
};

const heroTopRowStyle: React.CSSProperties = {
  position: 'relative',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 18,
  flexWrap: 'wrap',
};

const logoWrapStyle: React.CSSProperties = {
  width: 72,
  height: 72,
  borderRadius: 18,
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
  display: 'grid',
  placeItems: 'center',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
};

const logoStyle: React.CSSProperties = {
  width: 52,
  height: 52,
  objectFit: 'contain',
  filter: 'drop-shadow(0 0 14px rgba(255,107,0,0.32))',
};

const eyebrowStyle: React.CSSProperties = {
  margin: 0,
  color: '#8A99AE',
  fontFamily: "'Space Grotesk', sans-serif",
  letterSpacing: 2,
  textTransform: 'uppercase',
  fontSize: 11,
};

const welcomeLineStyle: React.CSSProperties = {
  margin: '8px 0 0',
  color: '#F7C8A6',
  fontFamily: "'Outfit', sans-serif",
  fontSize: 13,
  letterSpacing: 0.4,
};

const heroTitleStyle: React.CSSProperties = {
  margin: '6px 0 8px',
  fontFamily: "'Bebas Neue', sans-serif",
  letterSpacing: 2.5,
  fontWeight: 400,
  fontSize: 'clamp(2.4rem, 5vw, 4rem)',
  lineHeight: 0.95,
};

const heroSubtitleStyle: React.CSSProperties = {
  margin: 0,
  color: '#B9C4D1',
  fontFamily: "'Outfit', sans-serif",
  maxWidth: 640,
  lineHeight: 1.6,
  fontSize: 14,
};

const heroAsideStyle: React.CSSProperties = {
  display: 'grid',
  gap: 10,
  justifyItems: 'start',
};

const clientIdentityStyle: React.CSSProperties = {
  display: 'grid',
  gap: 8,
  justifyItems: 'start',
};

const heroChipStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  borderRadius: 999,
  border: '1px solid rgba(255,255,255,0.1)',
  padding: '6px 10px',
  color: '#D7E0EA',
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 11,
  background: 'rgba(255,255,255,0.03)',
};

const heroEmailStyle: React.CSSProperties = {
  margin: 0,
  color: '#8A99AE',
  fontFamily: "'Outfit', sans-serif",
  fontSize: 13,
};

const heroActionLinkStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  color: '#D9E1EB',
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 12,
  textDecoration: 'none',
  border: '1px solid #303949',
  borderRadius: 10,
  padding: '8px 10px',
  background: 'rgba(10,12,15,0.45)',
};

const signOutButtonStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  border: '1px solid #303949',
  borderRadius: 12,
  padding: '10px 16px',
  background: 'rgba(10,12,15,0.6)',
  color: '#D9E1EB',
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 13,
  cursor: 'pointer',
};

const heroSummaryGridStyle: React.CSSProperties = {
  position: 'relative',
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
  gap: 12,
  marginTop: 22,
};

const portalNavStyle: React.CSSProperties = {
  marginTop: 14,
  display: 'flex',
  gap: 8,
  overflowX: 'auto',
  paddingBottom: 2,
  WebkitOverflowScrolling: 'touch',
};

const portalNavLinkStyle: React.CSSProperties = {
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 999,
  padding: '8px 12px',
  color: '#D7E0EA',
  textDecoration: 'none',
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 12,
  whiteSpace: 'nowrap',
  background: 'rgba(10,12,15,0.48)',
};

const summaryCardStyle = (accent: string): React.CSSProperties => ({
  borderRadius: 18,
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)',
  padding: 16,
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  boxShadow: `inset 0 1px 0 rgba(255,255,255,0.04), 0 0 0 1px ${accent}14`,
});

const summaryIconStyle = (accent: string): React.CSSProperties => ({
  width: 38,
  height: 38,
  borderRadius: 12,
  background: `${accent}20`,
  color: accent,
  display: 'grid',
  placeItems: 'center',
  flexShrink: 0,
});

const summaryLabelStyle: React.CSSProperties = {
  margin: 0,
  color: '#8A99AE',
  fontSize: 12,
  fontFamily: "'Outfit', sans-serif",
};

const summaryValueStyle: React.CSSProperties = {
  margin: '2px 0 0',
  color: '#F0F4F8',
  fontFamily: "'Space Grotesk', sans-serif",
  fontWeight: 700,
  fontSize: 'clamp(18px, 4.2vw, 22px)',
};

const featureGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: 20,
};

const sectionCardStyle: React.CSSProperties = {
  border: '1px solid rgba(83, 96, 114, 0.34)',
  borderRadius: 24,
  background: 'linear-gradient(180deg, rgba(17,19,24,0.92) 0%, rgba(13,16,21,0.97) 100%)',
  padding: 'clamp(14px, 2.6vw, 22px)',
  boxShadow: '0 18px 46px rgba(0,0,0,0.28)',
};

const sideGuideCardStyle: React.CSSProperties = {
  ...sectionCardStyle,
  background: 'linear-gradient(180deg, rgba(24,30,39,0.94) 0%, rgba(14,18,25,0.98) 100%)',
};

const sectionHeadStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  alignItems: 'center',
  flexWrap: 'wrap',
  marginBottom: 14,
};

const sectionEyebrowStyle: React.CSSProperties = {
  margin: 0,
  color: '#8A99AE',
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: 1.4,
};

const sectionTitleStyle: React.CSSProperties = {
  margin: '6px 0 0',
  color: '#F0F4F8',
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 'clamp(20px, 4.5vw, 24px)',
  lineHeight: 1.2,
};

const sectionPillStyle: React.CSSProperties = {
  borderRadius: 999,
  border: '1px solid rgba(255,140,53,0.32)',
  padding: '7px 11px',
  color: '#FFD5B8',
  fontSize: 11,
  fontFamily: "'Space Grotesk', sans-serif",
  background: 'rgba(255,107,0,0.1)',
};

const timelineRowStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '34px 1fr',
  gap: 10,
  alignItems: 'start',
};

const timelineIndexStyle: React.CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: 12,
  background: 'linear-gradient(180deg, rgba(255,107,0,0.18) 0%, rgba(255,107,0,0.08) 100%)',
  color: '#FF8C35',
  display: 'grid',
  placeItems: 'center',
  fontFamily: "'Space Grotesk', sans-serif",
  fontWeight: 700,
  border: '1px solid rgba(255,107,0,0.18)',
};

const timelineTextStyle: React.CSSProperties = {
  margin: '6px 0 0',
  color: '#C7D2DF',
  fontSize: 13,
  lineHeight: 1.55,
};

const guideNoteStyle: React.CSSProperties = {
  marginTop: 16,
  borderRadius: 16,
  border: '1px solid rgba(255,140,53,0.2)',
  background: 'rgba(255,107,0,0.08)',
  padding: '12px 14px',
  display: 'flex',
  gap: 10,
  alignItems: 'start',
  color: '#FFD9C2',
  fontSize: 13,
  lineHeight: 1.5,
};

const contentSectionStyle: React.CSSProperties = {
  display: 'grid',
  gap: 12,
};

const sectionHeaderBarStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'end',
  gap: 10,
  flexWrap: 'wrap',
};

const sectionMutedMetaStyle: React.CSSProperties = {
  color: '#8A99AE',
  fontSize: 12,
  fontFamily: "'Space Grotesk', sans-serif",
};

const stackStyle: React.CSSProperties = {
  display: 'grid',
  gap: 12,
};

const itemCardStyle: React.CSSProperties = {
  border: '1px solid rgba(83, 96, 114, 0.3)',
  borderRadius: 18,
  background: 'linear-gradient(180deg, rgba(17,19,24,0.9) 0%, rgba(11,14,18,0.96) 100%)',
  padding: 18,
  display: 'grid',
  gap: 12,
  boxShadow: '0 14px 30px rgba(0,0,0,0.18)',
};

const itemTitleStyle: React.CSSProperties = {
  margin: 0,
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 16,
  color: '#F0F4F8',
};

const itemSubtitleStyle: React.CSSProperties = {
  margin: '4px 0 0',
  color: '#B9C4D1',
  fontSize: 13,
};

const statusPillStyle: React.CSSProperties = {
  border: '1px solid rgba(125, 211, 252, 0.22)',
  borderRadius: 999,
  padding: '5px 10px',
  fontSize: 11,
  color: '#D3DCE8',
  background: 'rgba(125,211,252,0.08)',
  fontFamily: "'Space Grotesk', sans-serif",
};

const messageCardStyle: React.CSSProperties = {
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 12,
  padding: 12,
  background: 'rgba(8,10,15,0.58)',
};

const awaitingResponseStyle: React.CSSProperties = {
  marginTop: 8,
  color: '#FBBF24',
  fontSize: 12,
  fontFamily: "'Space Grotesk', sans-serif",
};

const inlineLinkStyle: React.CSSProperties = {
  color: '#FF8C35',
  textDecoration: 'none',
  fontSize: 13,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
};

const jobMetaGridStyle: React.CSSProperties = {
  marginTop: 12,
  display: 'grid',
  gap: 8,
  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
};

const jobMetaCardStyle: React.CSSProperties = {
  borderRadius: 12,
  border: '1px solid rgba(255,255,255,0.05)',
  background: 'rgba(255,255,255,0.025)',
  padding: '10px 12px',
  display: 'grid',
  gap: 4,
  color: '#D5DEE8',
  fontSize: 13,
};

const jobMetaLabelStyle: React.CSSProperties = {
  color: '#8A99AE',
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: 1,
  fontFamily: "'Space Grotesk', sans-serif",
};

const progressRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 10,
  borderTop: '1px dashed #252B35',
  paddingTop: 8,
  fontSize: 13,
  color: '#C7D2DF',
};

const uploadButtonWrapStyle = (disabled: boolean): React.CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  border: '1px solid #303949',
  borderRadius: 10,
  padding: '9px 12px',
  cursor: disabled ? 'not-allowed' : 'pointer',
  background: 'rgba(255,255,255,0.02)',
});

const emptyStateStyle: React.CSSProperties = {
  borderRadius: 16,
  border: '1px dashed rgba(83, 96, 114, 0.42)',
  background: 'rgba(17,19,24,0.72)',
  padding: '18px 16px',
  color: '#8A99AE',
  fontSize: 14,
};
