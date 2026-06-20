import { useState } from 'react';
import { toast } from 'sonner';
import { Download, FileText } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { DateRangePicker } from '@/components/ui/date-picker';
import { downloadReportCsv, downloadReportPdf, getReportSummary } from '@/api/reports';
import { useAuthStore } from '@/store/authStore';
import { formatCurrency, formatDate, formatTime, getErrorMessage } from '@/lib/utils';
import type { ReportSummary } from '@/types';

function ReportsPage() {
  const user = useAuthStore((s) => s.user);
  const currency = user?.currency ?? 'INR';
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const localDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  const [startDate, setStartDate] = useState(
    `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`
  );
  const [endDate, setEndDate] = useState(
    localDate(now)
  );
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      setSummary(await getReportSummary(startDate, endDate));
    } catch (e) { toast.error(getErrorMessage(e)); }
    finally { setIsLoading(false); }
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCsvDownload = async () => {
    try {
      const blob = await downloadReportCsv(startDate, endDate);
      downloadBlob(blob, `report_${startDate}_${endDate}.csv`);
    } catch (e) { toast.error(getErrorMessage(e)); }
  };

  const handlePdfDownload = async () => {
    try {
      const blob = await downloadReportPdf(startDate, endDate);
      downloadBlob(blob, `report_${startDate}_${endDate}.pdf`);
    } catch (e) { toast.error(getErrorMessage(e)); }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Reports</h1>

      {/* Date range picker */}
      <div className="rounded-xl border bg-card p-5">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="space-y-1">
            <Label>Date Range</Label>
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onStartChange={setStartDate}
              onEndChange={setEndDate}
              startPlaceholder="From"
              endPlaceholder="To"
              disableFuture
            />
          </div>
          <Button onClick={handleGenerate} disabled={isLoading}>
            {isLoading ? 'Loading...' : 'Generate Report'}
          </Button>
        </div>
      </div>

      {summary && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Total Income',  value: summary.total_income,  color: 'text-emerald-600' },
              { label: 'Total Expense', value: summary.total_expense, color: 'text-rose-600' },
              { label: 'Net',           value: summary.net,           color: summary.net >= 0 ? 'text-emerald-600' : 'text-rose-600' },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-xl border bg-card p-5">
                <p className="text-xs text-muted-foreground mb-1">{label}</p>
                <p className={`text-2xl font-bold ${color}`}>{formatCurrency(value, currency)}</p>
              </div>
            ))}
          </div>

          {/* Export buttons */}
          <div className="flex gap-3">
            <Button variant="outline" className="gap-2 cursor-pointer" onClick={handleCsvDownload}>
              <Download size={16} /> Export CSV
            </Button>
            <Button variant="outline" className="gap-2 cursor-pointer" onClick={handlePdfDownload}>
              <FileText size={16} /> Export PDF
            </Button>
          </div>

          {/* By category */}
          <div className="rounded-xl border bg-card p-5">
            <h3 className="text-sm font-semibold mb-4">By Category</h3>
            <div className="space-y-2">
              {summary.by_category.map((row, i) => (
                <div key={i} className="flex items-center justify-between text-sm py-1 border-b last:border-0">
                  <span>{row.category}</span>
                  <span className={`font-medium ${row.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {formatCurrency(row.total, currency)} ({row.count} txn)
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Transactions table */}
          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="px-5 py-4 border-b">
              <h3 className="text-sm font-semibold">Transactions ({summary.transactions.length})</h3>
            </div>
            <div className="divide-y">
              {summary.transactions.map((t) => (
                <div key={t.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium">{t.category?.name ?? 'Uncategorised'}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(t.date)}{t.time ? ` · ${formatTime(t.time)}` : ''} · {t.account?.name}</p>
                  </div>
                  <span className={`text-sm font-semibold ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {t.type === 'income' ? '+' : '−'}{formatCurrency(t.amount, currency)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default ReportsPage;
