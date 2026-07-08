import { useEffect, useRef } from 'react';
import { useNotificationStore } from '../store/notificationStore';

export function useNotifications() {
  const store = useNotificationStore();
  const fetched = useRef(false);

  useEffect(() => {
    if (!fetched.current && !store.loading) {
      fetched.current = true;
      store.fetchNotifications();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return store;
}
