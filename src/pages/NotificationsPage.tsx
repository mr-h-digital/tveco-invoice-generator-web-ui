import { useEffect, useState } from 'react';
import { RefreshCw, MailWarning, Trash2, Send, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { TopBar } from '../components/layout/TopBar';
import { PageBackground } from '../components/layout/PageBackground';
import { useNotifications } from '../hooks/useNotifications';
import { formatDateShort } from '../utils/formatDate';
import { Modal } from '../components/shared/Modal';
import invoicesBg from '../assets/tveco-invoices-bg.jpg';

export function NotificationsPage() {
  const [previewMessageId, setPreviewMessageId] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<'html' | 'text'>('html');

  const {
    notifications,
    outboxMessages,
    outboxPending,
    outboxFailed,
    outboxSent,
    fetchOutboxMessages,
    retryOutboxMessage,
    clearSentOutbox,
    dispatchOutbox,
    dispatchingOutbox,
  } = useNotifications();

  const previewMessage = previewMessageId
    ? outboxMessages.find((msg) => msg.id === previewMessageId) ?? null
    : null;

  useEffect(() => {
    fetchOutboxMessages();
  }, [fetchOutboxMessages]);

  async function handleDispatch() {
    const result = await dispatchOutbox();
    if (result.skipped) {
      toast.error('Webhook not configured. Set VITE_NOTIFICATION_WEBHOOK_URL.');
      return;
    }
    toast.success(`Dispatch complete: ${result.sent} sent, ${result.failed} failed`);
  }

  async function handleRetry(id: string) {
    await retryOutboxMessage(id);
    toast.success('Message moved back to pending queue');
  }

  async function handleClearSent() {
    const removed = await clearSentOutbox();
    toast.success(`Cleared ${removed} sent outbox item${removed === 1 ? '' : 's'}`);
  }

  function handleOpenPreview(id: string) {
    const selected = outboxMessages.find((msg) => msg.id === id);
    setPreviewMode(selected?.bodyHtml ? 'html' : 'text');
    setPreviewMessageId(id);
  }

  return (
    <PageBackground image={invoicesBg} position="center 25%">
      <TopBar
        title="Notifications"
        subtitle="Operational events and email outbox"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={handleDispatch}
              disabled={dispatchingOutbox}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white hover:opacity-90 disabled:opacity-40 transition-opacity"
              style={{ background: '#FF6B00' }}
            >
              <Send size={14} />
              {dispatchingOutbox ? 'Dispatching...' : 'Dispatch Pending'}
            </button>
            <button
              onClick={handleClearSent}
              className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg text-sm border border-brand-border text-brand-text hover:bg-brand-card2 transition-colors"
            >
              <Trash2 size={14} />
              Clear Sent
            </button>
          </div>
        }
      />

      <div className="p-4 sm:p-6 lg:p-8 grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 bg-brand-card border border-brand-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-brand-border flex items-center justify-between">
            <p className="text-sm font-head text-brand-white">Recent Events</p>
            <span className="text-xs text-brand-muted">{notifications.length} total</span>
          </div>
          <div className="max-h-[620px] overflow-y-auto divide-y divide-brand-border">
            {notifications.length === 0 ? (
              <div className="p-4 text-sm text-brand-muted">No notifications yet.</div>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {!n.read && <span className="w-2 h-2 rounded-full" style={{ background: '#FF6B00' }} />}
                    <p className="text-sm text-brand-white font-medium">{n.title}</p>
                  </div>
                  <p className="text-xs text-brand-text mt-1">{n.message}</p>
                  <p className="text-[11px] text-brand-muted mt-1">{formatDateShort(n.createdAt.split('T')[0])}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-brand-card border border-brand-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-brand-border">
            <p className="text-sm font-head text-brand-white">Email Outbox</p>
            <p className="text-xs text-brand-muted mt-1">Pending: {outboxPending} · Failed: {outboxFailed} · Sent: {outboxSent}</p>
          </div>

          <div className="max-h-[620px] overflow-y-auto divide-y divide-brand-border">
            {outboxMessages.length === 0 ? (
              <div className="p-4 text-sm text-brand-muted">Outbox is empty.</div>
            ) : (
              outboxMessages.map((msg) => (
                <div key={msg.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="min-w-0">
                      <p className="text-sm text-brand-white truncate">{msg.subject}</p>
                      <p className="text-xs text-brand-muted truncate">To: {msg.to}</p>
                    </div>
                    <span className="text-[11px] px-2 py-0.5 rounded-full border border-brand-border text-brand-text">
                      {msg.status}
                    </span>
                  </div>

                  {msg.lastError && (
                    <div className="text-[11px] text-red-300/90 flex items-start gap-1.5 mb-2">
                      <MailWarning size={12} className="mt-[1px]" />
                      <span className="break-words">{msg.lastError}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2 text-[11px] text-brand-muted">
                    <span>Attempts: {msg.attempts}</span>
                    <span>{formatDateShort(msg.createdAt.split('T')[0])}</span>
                  </div>

                  <div className="mt-2 flex items-center gap-2">
                    <button
                      onClick={() => handleOpenPreview(msg.id)}
                      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md border border-brand-border text-xs text-brand-text hover:bg-brand-card2 transition-colors"
                    >
                      <Eye size={12} />
                      Preview
                    </button>

                    {msg.status === 'FAILED' && (
                      <button
                        onClick={() => handleRetry(msg.id)}
                        className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md border border-brand-border text-xs text-brand-text hover:bg-brand-card2 transition-colors"
                      >
                        <RefreshCw size={12} />
                        Retry
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <Modal
        open={!!previewMessage}
        onClose={() => setPreviewMessageId(null)}
        title="Email Preview"
        size="lg"
      >
        {previewMessage && (
          <div className="space-y-3">
            <div className="rounded-lg border border-brand-border p-3 bg-brand-card2">
              <p className="text-xs text-brand-muted">To</p>
              <p className="text-sm text-brand-white truncate">{previewMessage.to}</p>
              <p className="text-xs text-brand-muted mt-2">Subject</p>
              <p className="text-sm text-brand-white">{previewMessage.subject}</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPreviewMode('html')}
                disabled={!previewMessage.bodyHtml}
                className="px-3 py-1.5 rounded-md text-xs border border-brand-border enabled:hover:bg-brand-card2 disabled:opacity-40 transition-colors"
                style={previewMode === 'html' ? { background: '#FF6B00', color: '#fff', borderColor: '#FF6B00' } : { color: '#C8D4E0' }}
              >
                HTML
              </button>
              <button
                onClick={() => setPreviewMode('text')}
                className="px-3 py-1.5 rounded-md text-xs border border-brand-border hover:bg-brand-card2 transition-colors"
                style={previewMode === 'text' ? { background: '#FF6B00', color: '#fff', borderColor: '#FF6B00' } : { color: '#C8D4E0' }}
              >
                Plain Text
              </button>
            </div>

            {previewMode === 'html' && previewMessage.bodyHtml ? (
              <div className="rounded-lg border border-brand-border overflow-hidden bg-white">
                <iframe
                  title="Email HTML Preview"
                  srcDoc={previewMessage.bodyHtml}
                  className="w-full h-[420px] border-0"
                />
              </div>
            ) : (
              <pre className="rounded-lg border border-brand-border bg-brand-card2 text-brand-text text-xs leading-relaxed whitespace-pre-wrap p-3 max-h-[420px] overflow-auto">
                {previewMessage.body}
              </pre>
            )}
          </div>
        )}
      </Modal>
    </PageBackground>
  );
}
