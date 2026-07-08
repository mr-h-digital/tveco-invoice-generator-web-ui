export interface TourStep {
  path: string;
  title: string;
  description: string;
  actionLabel: string;
  targetId: string;
}

export const TOUR_STEPS: TourStep[] = [
  {
    path: '/dashboard',
    title: 'Dashboard Overview',
    description: 'Start here to see your totals, recent invoices, and cash flow snapshot at a glance.',
    actionLabel: 'View dashboard summary',
    targetId: 'dashboard-stats-grid',
  },
  {
    path: '/clients',
    title: 'Save Clients First',
    description: 'Add your clients once, then reuse their details in invoices and quotes without retyping.',
    actionLabel: 'Add your first client',
    targetId: 'clients-add-button',
  },
  {
    path: '/quotes',
    title: 'Build Quotes Quickly',
    description: 'Create and send quotes, then track statuses such as Draft, Sent, and Accepted.',
    actionLabel: 'Create a quote',
    targetId: 'quotes-new-button',
  },
  {
    path: '/invoices',
    title: 'Issue Invoices',
    description: 'Generate professional invoices, print/share PDFs, and track payment status over time.',
    actionLabel: 'Create an invoice',
    targetId: 'invoices-new-button',
  },
  {
    path: '/analytics',
    title: 'Monitor Performance',
    description: 'Review revenue trends, collections, and top clients to understand business performance.',
    actionLabel: 'Open analytics insights',
    targetId: 'analytics-download-button',
  },
];

export const ROUTE_TIPS: Record<string, string> = {
  '/dashboard': 'Use the Recent Invoices panel to jump directly into follow-up actions.',
  '/clients': 'Tip: Keep contact and tax details complete so documents are generated accurately.',
  '/quotes': 'Tip: Duplicate an older quote to speed up repeat proposals.',
  '/invoices': 'Tip: Filter by status to quickly chase SENT or OVERDUE invoices.',
  '/analytics': 'Tip: Use date filters before exporting so reports match your reporting period.',
};
