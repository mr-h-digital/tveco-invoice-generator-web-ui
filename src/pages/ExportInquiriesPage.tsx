import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { TopBar } from '../components/layout/TopBar';
import { PageBackground } from '../components/layout/PageBackground';
import { exportInquiryService } from '../services/exportInquiryService';
import type { ExportInquiry, ExportInquiryStatus } from '../types/exportInquiry';
import invoicesBg from '../assets/tveco-invoices-bg.jpg';

const STATUS_OPTIONS: ExportInquiryStatus[] = [
  'SUBMITTED',
  'UNDER_REVIEW',
  'WAITING_ON_CLIENT',
  'READY_FOR_QUOTE',
  'QUOTED',
  'QUOTE_ACCEPTED',
  'CONVERTED_TO_JOB',
  'CLOSED',
];

export function ExportInquiriesPage() {
  const navigate = useNavigate();
  const [inquiries, setInquiries] = useState<ExportInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [adminMessage, setAdminMessage] = useState('');
  const [requiresClientResponse, setRequiresClientResponse] = useState(true);
  const [statusDraft, setStatusDraft] = useState<ExportInquiryStatus>('UNDER_REVIEW');

  const selectedInquiry = useMemo(
    () => inquiries.find((item) => item.id === selectedId) ?? null,
    [inquiries, selectedId]
  );

  async function loadInquiries() {
    setLoading(true);
    try {
      const data = await exportInquiryService.getInquiries();
      setInquiries(data);
      if (!selectedId && data.length > 0) {
        setSelectedId(data[0].id);
        setStatusDraft(data[0].status);
      }
    } catch {
      toast.error('Could not load export inquiries');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadInquiries();
  }, []);

  useEffect(() => {
    if (selectedInquiry) {
      setStatusDraft(selectedInquiry.status);
    }
  }, [selectedInquiry]);

  async function sendAdminMessage() {
    if (!selectedInquiry) return;
    if (!adminMessage.trim()) {
      toast.error('Message cannot be empty');
      return;
    }

    try {
      const updated = await exportInquiryService.addAdminMessage(selectedInquiry.id, {
        message: adminMessage,
        requiresClientResponse,
      });
      setInquiries((prev) => prev.map((inquiry) => (inquiry.id === updated.id ? updated : inquiry)));
      setAdminMessage('');
      toast.success('Message sent to client portal');
    } catch {
      toast.error('Could not send request for details');
    }
  }

  async function applyStatus() {
    if (!selectedInquiry) return;

    try {
      const updated = await exportInquiryService.updateStatus(selectedInquiry.id, statusDraft);
      setInquiries((prev) => prev.map((inquiry) => (inquiry.id === updated.id ? updated : inquiry)));
      toast.success('Inquiry status updated');
    } catch {
      toast.error('Could not update inquiry status');
    }
  }

  async function convertToJob() {
    if (!selectedInquiry?.linkedQuoteId) {
      toast.error('An accepted quote is required before conversion to export job');
      return;
    }

    try {
      const job = await exportInquiryService.convertToJob(selectedInquiry.id, selectedInquiry.linkedQuoteId);
      toast.success(`Converted to export job ${job.jobNumber}`);
      await loadInquiries();
    } catch {
      toast.error('Could not convert inquiry to export job');
    }
  }

  function startQuoteFromInquiry() {
    if (!selectedInquiry) return;
    navigate('/quotes/new', {
      state: {
        fromInquiry: {
          inquiryId: selectedInquiry.id,
          clientId: selectedInquiry.clientId,
          destinationCountry: selectedInquiry.destinationCountry,
          vehicleDescription: selectedInquiry.vehicleDescription,
          notes: selectedInquiry.notes,
          projectValue: selectedInquiry.projectValue,
        },
      },
    });
  }

  return (
    <PageBackground image={invoicesBg} position="center 25%">
      <TopBar title="Export Inquiries" subtitle="Client requests, clarifications, quote handoff" />

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(340px, 1fr) minmax(520px, 2fr)', gap: 16, padding: 16, minHeight: 0, flex: 1 }}>
        <section style={cardStyle}>
          <h3 style={headingStyle}>Inquiry Queue</h3>
          {loading ? <p style={mutedStyle}>Loading...</p> : null}
          {!loading && inquiries.length === 0 ? <p style={mutedStyle}>No export inquiries yet.</p> : null}
          <div style={{ display: 'grid', gap: 10, marginTop: 10 }}>
            {inquiries.map((inquiry) => (
              <button
                key={inquiry.id}
                onClick={() => setSelectedId(inquiry.id)}
                style={{
                  ...queueItemStyle,
                  border: inquiry.id === selectedId ? '1px solid #FF6B00' : '1px solid #252B35',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                  <strong style={{ color: '#F0F4F8', fontSize: 13 }}>{inquiry.inquiryNumber}</strong>
                  <span style={statusBadgeStyle}>{inquiry.status}</span>
                </div>
                <p style={{ margin: '6px 0 0', color: '#B9C4D1', fontSize: 13 }}>
                  {inquiry.vehicleDescription} to {inquiry.destinationCountry}
                </p>
                <p style={{ margin: '6px 0 0', color: '#8A99AE', fontSize: 12 }}>
                  {new Date(inquiry.createdAt).toLocaleString()}
                </p>
              </button>
            ))}
          </div>
        </section>

        <section style={cardStyle}>
          {!selectedInquiry ? <p style={mutedStyle}>Select an inquiry to view details.</p> : null}
          {selectedInquiry ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                <div>
                  <h3 style={{ ...headingStyle, marginBottom: 4 }}>{selectedInquiry.inquiryNumber}</h3>
                  <p style={mutedStyle}>{selectedInquiry.inquiryType} • {selectedInquiry.sourceChannel}</p>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <select value={statusDraft} onChange={(e) => setStatusDraft(e.target.value as ExportInquiryStatus)} style={fieldStyle}>
                    {STATUS_OPTIONS.map((status) => <option key={status} value={status}>{status}</option>)}
                  </select>
                  <button onClick={applyStatus} style={actionButtonStyle}>Update Status</button>
                </div>
              </div>

              <div style={{ marginTop: 12, display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                <div style={metaTileStyle}>Destination: <strong>{selectedInquiry.destinationCountry}</strong></div>
                <div style={metaTileStyle}>Vehicle: <strong>{selectedInquiry.vehicleDescription}</strong></div>
                <div style={metaTileStyle}>Project Value: <strong>{selectedInquiry.projectValue == null ? 'Pending quote' : `ZAR ${selectedInquiry.projectValue.toFixed(2)}`}</strong></div>
                <div style={metaTileStyle}>Linked Quote: <strong>{selectedInquiry.linkedQuoteNumber ?? 'Not yet created'}</strong></div>
              </div>

              <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button onClick={startQuoteFromInquiry} style={actionButtonStyle}>Create Quote From Inquiry</button>
                <button
                  onClick={convertToJob}
                  disabled={!selectedInquiry.linkedQuoteId || selectedInquiry.linkedQuoteStatus !== 'ACCEPTED' || !!selectedInquiry.linkedExportJobId}
                  style={actionButtonStyle}
                >
                  {selectedInquiry.linkedExportJobId ? `Converted: ${selectedInquiry.linkedExportJobNumber}` : 'Convert Accepted Quote to Export Job'}
                </button>
              </div>

              <div style={{ marginTop: 14 }}>
                <h4 style={subHeadingStyle}>Request More Details / Discussion</h4>
                <div style={{ maxHeight: 260, overflowY: 'auto', display: 'grid', gap: 8, paddingRight: 4 }}>
                  {selectedInquiry.messages.map((msg) => (
                    <div key={msg.id} style={{ border: '1px solid #252B35', borderRadius: 10, padding: 10, background: '#0A0C0F' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                        <strong style={{ color: msg.senderRole === 'ADMIN' ? '#F0F4F8' : '#9CD3FF' }}>{msg.senderRole}</strong>
                        <span style={{ color: '#8A99AE', fontSize: 12 }}>{new Date(msg.createdAt).toLocaleString()}</span>
                      </div>
                      <p style={{ margin: '6px 0 0', color: '#C7D2DF', whiteSpace: 'pre-wrap' }}>{msg.message}</p>
                      {msg.requiresClientResponse ? (
                        <p style={{ margin: '6px 0 0', color: msg.clientResponded ? '#4ADE80' : '#FBBF24', fontSize: 12 }}>
                          {msg.clientResponded ? 'Client responded' : 'Awaiting client response'}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
                  <textarea
                    value={adminMessage}
                    onChange={(e) => setAdminMessage(e.target.value)}
                    placeholder="Ask for more detail or provide clarification..."
                    style={{ ...fieldStyle, minHeight: 90, resize: 'vertical' }}
                  />
                  <label style={{ display: 'flex', gap: 8, alignItems: 'center', color: '#B9C4D1', fontSize: 13 }}>
                    <input
                      type="checkbox"
                      checked={requiresClientResponse}
                      onChange={(e) => setRequiresClientResponse(e.target.checked)}
                    />
                    Mark as requiring client response
                  </label>
                  <button onClick={sendAdminMessage} style={actionButtonStyle}>Send to Client Portal</button>
                </div>
              </div>
            </>
          ) : null}
        </section>
      </div>
    </PageBackground>
  );
}

const cardStyle: React.CSSProperties = {
  border: '1px solid #252B35',
  borderRadius: 14,
  background: 'rgba(17,19,24,0.9)',
  padding: 14,
  minHeight: 0,
  overflow: 'hidden',
};

const headingStyle: React.CSSProperties = {
  margin: 0,
  color: '#F0F4F8',
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 18,
};

const subHeadingStyle: React.CSSProperties = {
  margin: '0 0 8px',
  color: '#D3DCE8',
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 14,
};

const mutedStyle: React.CSSProperties = {
  margin: 0,
  color: '#8A99AE',
  fontSize: 13,
};

const queueItemStyle: React.CSSProperties = {
  textAlign: 'left',
  background: '#111318',
  borderRadius: 10,
  padding: 10,
  cursor: 'pointer',
};

const statusBadgeStyle: React.CSSProperties = {
  border: '1px solid #384252',
  borderRadius: 999,
  padding: '2px 8px',
  fontSize: 11,
  color: '#C7D2DF',
};

const fieldStyle: React.CSSProperties = {
  width: '100%',
  background: '#0A0C0F',
  border: '1px solid #2A3340',
  borderRadius: 8,
  padding: '9px 10px',
  color: '#F0F4F8',
  boxSizing: 'border-box',
};

const actionButtonStyle: React.CSSProperties = {
  border: 'none',
  borderRadius: 8,
  padding: '9px 12px',
  background: '#FF6B00',
  color: '#fff',
  fontFamily: "'Space Grotesk', sans-serif",
  fontWeight: 700,
  cursor: 'pointer',
};

const metaTileStyle: React.CSSProperties = {
  border: '1px solid #252B35',
  borderRadius: 8,
  padding: '8px 10px',
  color: '#B9C4D1',
  fontSize: 13,
  background: '#0A0C0F',
};
