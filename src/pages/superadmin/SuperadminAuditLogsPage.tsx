import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Search } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DateRangePicker } from '@/components/ui/date-picker';
import { getAuditLogs, type AuditLogFilters } from '@/api/superadmin';
import { formatDate, getErrorMessage } from '@/lib/utils';
import type { AuditLog } from '@/types';

export default function SuperadminAuditLogsPage() {
  const [logs,    setLogs]    = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page,    setPage]    = useState(1);
  const [total,   setTotal]   = useState(0);
  const [filters, setFilters] = useState<AuditLogFilters>({});
  const [search,  setSearch]  = useState('');

  const load = async (p = 1) => {
    setLoading(true);
    try {
      const res = await getAuditLogs({ ...filters, ...(search ? { action: search } : {}) });
      setLogs(res.data ?? []);
      setTotal(res.total ?? 0);
      setPage(p);
    } catch (e) { toast.error(getErrorMessage(e)); }
    finally { setLoading(false); }
  };

  useEffect(() => { void load(1); }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Audit Logs</h1>
        <p className="text-muted-foreground text-sm mt-1">Track all system activity and user actions.</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Filter by action..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load(1)}
          />
        </div>
        <DateRangePicker
          startDate={filters.start_date}
          endDate={filters.end_date}
          onStartChange={(v) => setFilters((f) => ({ ...f, start_date: v }))}
          onEndChange={(v) => setFilters((f) => ({ ...f, end_date: v }))}
          disableFuture
        />
        <Button onClick={() => load(1)}>Filter</Button>
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead className="bg-muted/50 text-muted-foreground sticky top-0 z-10">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Action</th>
              <th className="text-left px-4 py-3 font-medium">User</th>
              <th className="text-left px-4 py-3 font-medium">Description</th>
              <th className="text-left px-4 py-3 font-medium">IP</th>
              <th className="text-left px-4 py-3 font-medium">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-muted rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center text-muted-foreground py-12">No audit logs found.</td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">{log.action}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{log.user_id ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">{log.description ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{log.ip_address ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {formatDate(log.created_at)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* Pagination */}
      {total > 20 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{total} total entries</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => load(page - 1)}>Previous</Button>
            <Button variant="outline" size="sm" onClick={() => load(page + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}
