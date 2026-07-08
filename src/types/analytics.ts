export interface MonthRevenueDto {
  month: string;
  invoiced: number;
  paid: number;
  outstanding: number;
  overdue: number;
}

export interface StatusSliceDto {
  name: string;
  value: number;
  count: number;
  color: string;
}

export interface ClientRevenueDto {
  name: string;
  total: number;
  paid: number;
  invoices: number;
}

export interface ServiceRevenueDto {
  name: string;
  total: number;
  count: number;
}

export interface AnalyticsDto {
  totalInvoiced: number;
  totalPaid: number;
  totalOutstanding: number;
  totalOverdue: number;
  invoiceCount: number;
  clientCount: number;
  collectionRate: number;
  avgInvoiceValue: number;
  monthly: MonthRevenueDto[];
  statusBreakdown: StatusSliceDto[];
  topClients: ClientRevenueDto[];
  topServices: ServiceRevenueDto[];
}
