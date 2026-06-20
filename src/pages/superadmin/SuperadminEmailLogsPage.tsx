import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Download, Mail, Search, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DateRangePicker } from '@/components/ui/date-picker';
import { getEmailLogs, getEmailLog, exportEmailLogsCsv, exportEmailLogsPdf, type EmailLogFilters } from '@/api/superadmin';
import { formatDate, getErrorMessage } from '@/lib/utils';
import type { EmailLog, PaginatedResponse } from '@/types';

export default function SuperadminEmailLogsPage() {
  const [data,    setData]    = useState<PaginatedResponse<EmailLog> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page,    setPage]    = useState(1);
  const [search,  setSearch]  = useState('');
  const [filters, setFilters] = useState<EmailLogFilters>({});

  const [detailLog, setDetailLog] = useState<EmailLog | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = async (p = 1) => {
    setLoading(true);
    try {
      const params: EmailLogFilters = { ...filters, page: p, per_page: 20 };
      if (search) params.q = search;
      const result = await getEmailLogs(params);
      setData(result);
      setPage(p);
    } catch (e) { toast.error(getErrorMessage(e)); }
    finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, []);

  const handleFilter = () => void load(1);

  const handleClear = () => {
    setSearch('');
    setFilters({});
    void load(1);
  };

  const openDetail = async (id: string) => {
    setDetailLoading(true);
    setDetailOpen(true);
    try {
      setDetailLog(await getEmailLog(id));
    } catch (e) { toast.error(getErrorMessage(e)); }
    finally { setDetailLoading(false); }
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCsvExport = async () => {
    try {
      const params: EmailLogFilters = { ...filters };
      if (search) params.q = search;
      const blob = await exportEmailLogsCsv(params);
      downloadBlob(blob, 'email_logs.csv');
    } catch (e) { toast.error(getErrorMessage(e)); }
  };

  const handlePdfExport = async () => {
    try {
      const params: EmailLogFilters = { ...filters };
      if (search) params.q = search;
      const blob = await exportEmailLogsPdf(params);
      downloadBlob(blob, 'email_logs.pdf');
    } catch (e) { toast.error(getErrorMessage(e)); }
  };

  const logs  = data?.data ?? [];
  const total = (data as any)?.total ?? 0;

  const hasFilters = search || filters.status || filters.template || filters.channel || filters.start_date || filters.end_date;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Email Logs</h1>
        <p className="text-muted-foreground text-sm mt-1">Track all outgoing email notifications</p>
      </div>

      {/* Filters */}
      <div className="rounded-xl border bg-card p-4 space-y-3">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="relative flex-1 min-w-[180px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search recipient or subject..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleFilter()}
            />
          </div>

          <Select value={filters.status ?? ''} onValueChange={(v) => setFilters((f) => ({ ...f, status: v || undefined }))}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.template ?? ''} onValueChange={(v) => setFilters((f) => ({ ...f, template: v || undefined }))}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Template" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="welcome">Welcome</SelectItem>
              <SelectItem value="password_changed">Password Changed</SelectItem>
              <SelectItem value="transaction_alert">Transaction Alert</SelectItem>
              <SelectItem value="budget_exceeded">Budget Exceeded</SelectItem>
              <SelectItem value="account_deactivated">Account Deactivated</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.channel ?? ''} onValueChange={(v) => setFilters((f) => ({ ...f, channel: v || undefined }))}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Channel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="sms">SMS</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap gap-3 items-end">
          <DateRangePicker
            startDate={filters.start_date}
            endDate={filters.end_date}
            onStartChange={(v) => setFilters((f) => ({ ...f, start_date: v }))}
            onEndChange={(v) => setFilters((f) => ({ ...f, end_date: v }))}
            disableFuture
          />

          <Button onClick={handleFilter} size="sm">Filter</Button>

          {hasFilters && (
            <Button onClick={handleClear} variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
              <X size={14} /> Clear
            </Button>
          )}

          <div className="ml-auto flex gap-2">
            <Button onClick={handleCsvExport} variant="outline" size="sm" className="gap-1.5">
              <Download size={14} /> CSV
            </Button>
            <Button onClick={handlePdfExport} variant="outline" size="sm" className="gap-1.5">
              <Download size={14} /> PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead className="bg-muted/50 text-muted-foreground sticky top-0 z-10">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Recipient</th>
                <th className="text-left px-4 py-3 font-medium">Subject</th>
                <th className="text-left px-4 py-3 font-medium">Template</th>
                <th className="text-left px-4 py-3 font-medium">Channel</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Sent At</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-muted rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16">
                    <Mail className="mx-auto size-10 text-muted-foreground/30 mb-3" />
                    <p className="text-sm text-muted-foreground">No email logs found.</p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => void openDetail(log.id)}
                  >
                    <td className="px-4 py-3 font-medium">{log.recipient}</td>
                    <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">{log.subject}</td>
                    <td className="px-4 py-3">
                      {log.template ? (
                        <Badge variant="secondary" className="text-xs capitalize">{log.template.replace(/_/g, ' ')}</Badge>
                      ) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3 capitalize text-muted-foreground">{log.channel}</td>
                    <td className="px-4 py-3">
                      {log.status === 'sent'
                        ? <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-200">Sent</Badge>
                        : <Badge variant="destructive" className="text-xs">Failed</Badge>
                      }
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{formatDate(log.sent_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {total > 20 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{total} total logs</p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => void load(page - 1)}>Previous</Button>
            <Button size="sm" variant="outline" disabled={logs.length < 20} onClick={() => void load(page + 1)}>Next</Button>
          </div>
        </div>
      )}

      {/* Detail dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Email Log Details</DialogTitle>
          </DialogHeader>
          {detailLoading ? (
            <div className="space-y-3 py-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-4 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : detailLog ? (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs mb-0.5">Recipient</p>
                  <p className="font-medium">{detailLog.recipient}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-0.5">Status</p>
                  {detailLog.status === 'sent'
                    ? <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-200">Sent</Badge>
                    : <Badge variant="destructive" className="text-xs">Failed</Badge>
                  }
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground text-xs mb-0.5">Subject</p>
                  <p className="font-medium">{detailLog.subject}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-0.5">Template</p>
                  <p className="capitalize">{detailLog.template?.replace(/_/g, ' ') ?? '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-0.5">Channel</p>
                  <p className="capitalize">{detailLog.channel}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground text-xs mb-0.5">Sent At</p>
                  <p>{detailLog.sent_at ? formatDate(detailLog.sent_at) : '—'}</p>
                </div>
              </div>

              {detailLog.error_message && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3">
                  <p className="text-xs font-medium text-destructive mb-1">Error</p>
                  <p className="text-xs text-destructive/80 break-all">{detailLog.error_message}</p>
                </div>
              )}

              {detailLog.metadata && Object.keys(detailLog.metadata).length > 0 && (
                <div>
                  <p className="text-muted-foreground text-xs mb-1.5">Metadata</p>
                  <pre className="text-xs bg-muted rounded-lg p-3 overflow-x-auto">
                    {JSON.stringify(detailLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
