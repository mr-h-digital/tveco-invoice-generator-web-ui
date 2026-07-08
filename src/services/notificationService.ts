import { v4 as uuid } from 'uuid';
import type { AppNotification, EmailOutboxNotification, NotificationEventType } from '../types/notification';

const NOTIFICATIONS_KEY = 'tveco_notifications_v1';
const EMAIL_OUTBOX_KEY = 'tveco_email_outbox_v1';

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
    return raw ? (JSON.parse(raw) as EmailOutboxNotification[]) : [];
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
      };
      const outbox = loadOutbox();
      saveOutbox([outboxItem, ...outbox].slice(0, 200));
    }

    return notification;
  },

  async unreadCount(): Promise<number> {
    return loadNotifications().filter((n) => !n.read).length;
  },
};
