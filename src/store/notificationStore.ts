import { create } from 'zustand';
import { notificationService } from '../services/notificationService';
import type { AppNotification } from '../types/notification';
import type { EmailOutboxNotification } from '../types/notification';

interface NotificationStore {
  notifications: AppNotification[];
  outboxMessages: EmailOutboxNotification[];
  loading: boolean;
  dispatchingOutbox: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  refreshUnread: () => Promise<void>;
  refreshOutboxStats: () => Promise<void>;
  fetchOutboxMessages: () => Promise<void>;
  retryOutboxMessage: (id: string) => Promise<void>;
  clearSentOutbox: () => Promise<number>;
  dispatchOutbox: () => Promise<{ sent: number; failed: number; skipped: boolean }>;
  unreadCount: number;
  outboxPending: number;
  outboxFailed: number;
  outboxSent: number;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],
  outboxMessages: [],
  loading: false,
  dispatchingOutbox: false,
  unreadCount: 0,
  outboxPending: 0,
  outboxFailed: 0,
  outboxSent: 0,

  fetchNotifications: async () => {
    set({ loading: true });
    const notifications = await notificationService.getNotifications();
    const unreadCount = notifications.filter((n) => !n.read).length;
    const outbox = await notificationService.outboxStats();
    const outboxMessages = await notificationService.getOutbox();
    set({
      notifications,
      outboxMessages,
      unreadCount,
      loading: false,
      outboxPending: outbox.pending,
      outboxFailed: outbox.failed,
      outboxSent: outbox.sent,
    });
  },

  markAsRead: async (id) => {
    await notificationService.markAsRead(id);
    const notifications = await notificationService.getNotifications();
    const unreadCount = notifications.filter((n) => !n.read).length;
    set({ notifications, unreadCount });
  },

  refreshUnread: async () => {
    const unreadCount = await notificationService.unreadCount();
    set({ unreadCount });
  },

  refreshOutboxStats: async () => {
    const outbox = await notificationService.outboxStats();
    set({
      outboxPending: outbox.pending,
      outboxFailed: outbox.failed,
      outboxSent: outbox.sent,
    });
  },

  fetchOutboxMessages: async () => {
    const outboxMessages = await notificationService.getOutbox();
    set({ outboxMessages });
  },

  retryOutboxMessage: async (id) => {
    await notificationService.retryOutboxMessage(id);
    const outbox = await notificationService.outboxStats();
    const outboxMessages = await notificationService.getOutbox();
    set({
      outboxPending: outbox.pending,
      outboxFailed: outbox.failed,
      outboxSent: outbox.sent,
      outboxMessages,
    });
  },

  clearSentOutbox: async () => {
    const removed = await notificationService.clearSentOutbox();
    const outbox = await notificationService.outboxStats();
    const outboxMessages = await notificationService.getOutbox();
    set({
      outboxPending: outbox.pending,
      outboxFailed: outbox.failed,
      outboxSent: outbox.sent,
      outboxMessages,
    });
    return removed;
  },

  dispatchOutbox: async () => {
    set({ dispatchingOutbox: true });
    const result = await notificationService.dispatchPendingOutbox();
    const notifications = await notificationService.getNotifications();
    const outboxMessages = await notificationService.getOutbox();
    const unreadCount = notifications.filter((n) => !n.read).length;
    const outbox = await notificationService.outboxStats();
    set({
      notifications,
      outboxMessages,
      unreadCount,
      outboxPending: outbox.pending,
      outboxFailed: outbox.failed,
      outboxSent: outbox.sent,
      dispatchingOutbox: false,
    });
    return result;
  },
}));
