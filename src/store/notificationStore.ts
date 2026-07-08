import { create } from 'zustand';
import { notificationService } from '../services/notificationService';
import type { AppNotification } from '../types/notification';

interface NotificationStore {
  notifications: AppNotification[];
  loading: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  refreshUnread: () => Promise<void>;
  unreadCount: number;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],
  loading: false,
  unreadCount: 0,

  fetchNotifications: async () => {
    set({ loading: true });
    const notifications = await notificationService.getNotifications();
    const unreadCount = notifications.filter((n) => !n.read).length;
    set({ notifications, unreadCount, loading: false });
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
}));
