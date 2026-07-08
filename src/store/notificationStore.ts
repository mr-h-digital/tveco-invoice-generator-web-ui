import { create } from 'zustand';
import { notificationService } from '../services/notificationService';
import type { AppNotification } from '../types/notification';

interface NotificationStore {
  notifications: AppNotification[];
  loading: boolean;
  dispatchingOutbox: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  refreshUnread: () => Promise<void>;
  refreshOutboxStats: () => Promise<void>;
  dispatchOutbox: () => Promise<{ sent: number; failed: number; skipped: boolean }>;
  unreadCount: number;
  outboxPending: number;
  outboxFailed: number;
  outboxSent: number;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],
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
    set({
      notifications,
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

  dispatchOutbox: async () => {
    set({ dispatchingOutbox: true });
    const result = await notificationService.dispatchPendingOutbox();
    const notifications = await notificationService.getNotifications();
    const unreadCount = notifications.filter((n) => !n.read).length;
    const outbox = await notificationService.outboxStats();
    set({
      notifications,
      unreadCount,
      outboxPending: outbox.pending,
      outboxFailed: outbox.failed,
      outboxSent: outbox.sent,
      dispatchingOutbox: false,
    });
    return result;
  },
}));
