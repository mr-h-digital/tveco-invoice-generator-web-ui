export type NotificationEventType =
  | 'EXPORT_STATUS_CHANGED'
  | 'EXPORT_DOCUMENT_COMPLETED'
  | 'EXPORT_PAYMENT_REMINDER';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  eventType: NotificationEventType;
  referenceId?: string;
}

export interface EmailOutboxNotification {
  id: string;
  to: string;
  subject: string;
  body: string;
  createdAt: string;
  status: 'PENDING';
}
