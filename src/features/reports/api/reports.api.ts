import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { CustomerReport, ProductReport, ReportRange, SalesOverview } from '@/types/report.types';

export const reportsApi = {
    overview: (r: ReportRange): Promise<SalesOverview> => apiClient.get('/reports/overview', r),
    products: (r: ReportRange): Promise<ProductReport> => apiClient.get('/reports/products', r),
    customers: (r: ReportRange & { limit?: number }): Promise<CustomerReport> => apiClient.get('/reports/customers', r),
};

const K = ['reports'] as const;
const opts = { placeholderData: keepPreviousData, staleTime: 60_000 };

export const useSalesOverview = (r: ReportRange) => useQuery({ queryKey: [...K, 'overview', r], queryFn: () => reportsApi.overview(r), ...opts });
export const useProductReport = (r: ReportRange) => useQuery({ queryKey: [...K, 'products', r], queryFn: () => reportsApi.products(r), ...opts });
export const useCustomerReport = (r: ReportRange, limit = 100) =>
    useQuery({ queryKey: [...K, 'customers', r, limit], queryFn: () => reportsApi.customers({ ...r, limit }), ...opts });
