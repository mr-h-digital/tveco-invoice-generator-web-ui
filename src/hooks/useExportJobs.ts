import { useEffect, useRef } from 'react';
import { useExportJobStore } from '../store/exportJobStore';

export function useExportJobs() {
  const store = useExportJobStore();
  const fetched = useRef(false);

  useEffect(() => {
    if (!fetched.current && store.jobs.length === 0 && !store.loading) {
      fetched.current = true;
      store.fetchJobs();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return store;
}
