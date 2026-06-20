import { api } from '@/api/axios';
import type { ApiResponse, AuditLog, EmailLog, PaginatedResponse } from '@/types';

export interface AuditLogFilters {
  user_id?:    string;
  action?:     string;
  start_date?: string;
  end_date?:   string;
}

export async function getAuditLogs(filters?: AuditLogFilters): Promise<PaginatedResponse<AuditLog>> {
  const response = await api.get<ApiResponse<PaginatedResponse<AuditLog>>>('/superadmin/audit-logs', { params: filters });
  return response.data.data;
}

export interface EmailLogFilters {
  q?:          string;
  status?:     string;
  template?:   string;
  channel?:    string;
  start_date?: string;
  end_date?:   string;
  page?:       number;
  per_page?:   number;
}

export async function getEmailLogs(filters?: EmailLogFilters): Promise<PaginatedResponse<EmailLog>> {
  const response = await api.get<ApiResponse<PaginatedResponse<EmailLog>>>('/superadmin/logs/email', { params: filters });
  return response.data.data;
}

export async function getEmailLog(id: string): Promise<EmailLog> {
  const response = await api.get<ApiResponse<EmailLog>>(`/superadmin/logs/email/${id}`);
  return response.data.data;
}

export async function exportEmailLogsCsv(filters?: EmailLogFilters): Promise<Blob> {
  const response = await api.get('/superadmin/logs/email/export/csv', { params: filters, responseType: 'blob' });
  return response.data;
}

export async function exportEmailLogsPdf(filters?: EmailLogFilters): Promise<Blob> {
  const response = await api.get('/superadmin/logs/email/export/pdf', { params: filters, responseType: 'blob' });
  return response.data;
}

export async function getAppSettings(): Promise<Record<string, Record<string, { value: string; type: string; is_public: boolean }>>> {
  const response = await api.get<ApiResponse<Record<string, unknown>>>('/superadmin/app-settings');
  return response.data.data as any;
}

export async function updateAppSettings(settings: { key: string; value: string }[]): Promise<void> {
  await api.put('/superadmin/app-settings', { settings });
}
