import { v4 as uuid } from 'uuid';
import type { AppNotification, EmailOutboxNotification, NotificationEventType } from '../types/notification';

const NOTIFICATIONS_KEY = 'tveco_notifications_v1';
const EMAIL_OUTBOX_KEY = 'tveco_email_outbox_v1';
const WEBHOOK_URL = import.meta.env.VITE_NOTIFICATION_WEBHOOK_URL?.trim();
const WEBHOOK_SECRET = import.meta.env.VITE_NOTIFICATION_WEBHOOK_SECRET?.trim();

interface EmitNotificationInput {
  eventType: NotificationEventType;
  title: string;
  message: string;
  referenceId?: string;
  emailTo?: string;
  emailSubject?: string;
  emailBody?: string;
}

function loadNotifications(): AppNotification[] {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_KEY);
    return raw ? (JSON.parse(raw) as AppNotification[]) : [];
  } catch {
    return [];
  }
}

function saveNotifications(notifications: AppNotification[]) {
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
}

function loadOutbox(): EmailOutboxNotification[] {
  try {
    const raw = localStorage.getItem(EMAIL_OUTBOX_KEY);
    const parsed = raw ? (JSON.parse(raw) as EmailOutboxNotification[]) : [];
    return parsed.map((item) => ({
      ...item,
      status: item.status ?? 'PENDING',
      attempts: Number.isFinite(item.attempts) ? item.attempts : 0,
    }));
  } catch {
    return [];
  }
}

function saveOutbox(outbox: EmailOutboxNotification[]) {
  localStorage.setItem(EMAIL_OUTBOX_KEY, JSON.stringify(outbox));
}

export const notificationService = {
  async getNotifications(): Promise<AppNotification[]> {
    return loadNotifications().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async markAsRead(id: string): Promise<void> {
    const notifications = loadNotifications().map((n) => (n.id === id ? { ...n, read: true } : n));
    saveNotifications(notifications);
  },

  async emit(input: EmitNotificationInput): Promise<AppNotification> {
    const notification: AppNotification = {
      id: uuid(),
      title: input.title,
      message: input.message,
      createdAt: new Date().toISOString(),
      read: false,
      eventType: input.eventType,
      referenceId: input.referenceId,
    };

    const notifications = loadNotifications();
    saveNotifications([notification, ...notifications].slice(0, 120));

    if (input.emailTo && input.emailSubject && input.emailBody) {
      const outboxItem: EmailOutboxNotification = {
        id: uuid(),
        to: input.emailTo,
        subject: input.emailSubject,
        body: input.emailBody,
        createdAt: new Date().toISOString(),
        status: 'PENDING',
        attempts: 0,
      };
      const outbox = loadOutbox();
      saveOutbox([outboxItem, ...outbox].slice(0, 200));
    }

    return notification;
  },

  async unreadCount(): Promise<number> {
    return loadNotifications().filter((n) => !n.read).length;
  },

  async outboxStats(): Promise<{ pending: number; failed: number; sent: number }> {
    const outbox = loadOutbox();
    return {
      pending: outbox.filter((m) => m.status === 'PENDING').length,
      failed: outbox.filter((m) => m.status === 'FAILED').length,
      sent: outbox.filter((m) => m.status === 'SENT').length,
    };
  },

  async getOutbox(): Promise<EmailOutboxNotification[]> {
    return loadOutbox().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async retryOutboxMessage(id: string): Promise<void> {
    const outbox = loadOutbox().map((item) => {
      if (item.id !== id) return item;
      return {
        ...item,
        status: 'PENDING' as const,
        lastError: undefined,
      };
    });
    saveOutbox(outbox);
  },

  async clearSentOutbox(): Promise<number> {
    const outbox = loadOutbox();
    const kept = outbox.filter((item) => item.status !== 'SENT');
    saveOutbox(kept);
    return outbox.length - kept.length;
  },

  async dispatchPendingOutbox(): Promise<{ sent: number; failed: number; skipped: boolean }> {
    if (!WEBHOOK_URL) {
      return { sent: 0, failed: 0, skipped: true };
    }

    const outbox = loadOutbox();
    const candidates = outbox.filter((m) => m.status === 'PENDING' || (m.status === 'FAILED' && m.attempts < 5));
    if (candidates.length === 0) {
      return { sent: 0, failed: 0, skipped: false };
    }

    let sent = 0;
    let failed = 0;
    const byId = new Map(outbox.map((item) => [item.id, item]));

    for (const msg of candidates) {
      const current = byId.get(msg.id);
      if (!current) continue;

      try {
        const response = await fetch(WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(WEBHOOK_SECRET ? { 'x-tveco-webhook-secret': WEBHOOK_SECRET } : {}),
          },
          body: JSON.stringify({
            id: current.id,
            to: current.to,
            subject: current.subject,
            body: current.body,
            createdAt: current.createdAt,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        sent += 1;
        byId.set(current.id, {
          ...current,
          status: 'SENT',
          attempts: current.attempts + 1,
          sentAt: new Date().toISOString(),
          lastError: undefined,
        });
      } catch (error) {
        failed += 1;
        byId.set(current.id, {
          ...current,
          status: 'FAILED',
          attempts: current.attempts + 1,
          lastError: String(error),
        });
      }
    }

    saveOutbox(Array.from(byId.values()).slice(0, 300));
    return { sent, failed, skipped: false };
  },
};
