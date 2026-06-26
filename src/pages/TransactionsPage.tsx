import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, Download, MoreVertical, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DatePicker, MonthPicker } from '@/components/ui/date-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { createTransaction, deleteTransaction, exportTransactionsCsv, getTransactions, updateTransaction, type TransactionFilters } from '@/api/transactions';
import { getAccounts } from '@/api/accounts';
import { getCategories } from '@/api/categories';
import { useAuthStore } from '@/store/authStore';
import { formatCurrency, formatDate, formatTime, getCurrencySymbol, getErrorMessage } from '@/lib/utils';
import type { Account, Category, Transaction } from '@/types';

const schema = z.object({
  account_id:  z.string().min(1, 'Required'),
  category_id: z.string().min(1, 'Required'),
  type:        z.enum(['income', 'expense', 'transfer']),
  amount:      z.coerce.number().positive('Must be positive'),
  date:        z.string().min(1, 'Required'),
  time:        z.string().optional(),
  note:        z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

function TransactionsPage() {
  const user = useAuthStore((s) => s.user);
  const [searchParams, setSearchParams] = useSearchParams();
  const currency = user?.currency ?? 'INR';
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [filterType, setFilterType] = useState(searchParams.get('type') ?? '');
  const [filterMonth, setFilterMonth] = useState(searchParams.get('month') ?? '');

  // Pagination + search
  const [page,    setPage]    = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [total,   setTotal]   = useState(0);
  const [search,  setSearch]  = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const isFirstRender = useRef(true);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      type: 'expense',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
    },
  });
  const txType = watch('type');

  const freshDefaults = () => ({
    type: 'expense' as const,
    account_id: '',
    category_id: '',
    amount: undefined as any,
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    note: '',
  });

  useEffect(() => {
    if (dialogOpen) {
      if (editingTx) {
        reset({
          type: editingTx.type as any,
          account_id: editingTx.account_id ?? '',
          category_id: editingTx.category_id ?? '',
          amount: editingTx.amount,
          date: editingTx.date?.split('T')[0] ?? '',
          time: editingTx.time ?? '',
          note: editingTx.note ?? '',
        });
      } else {
        reset(freshDefaults());
      }
      void Promise.all([getAccounts(), getCategories()]).then(([accs, cats]) => {
        setAccounts(accs);
        setCategories(cats);
      });
    }
  }, [dialogOpen]);

  const loadTransactions = async (p = page, pp = perPage, q = search, typeF = filterType, monthF = filterMonth) => {
    setIsLoading(true);
    try {
      const filters: TransactionFilters = { page: p, per_page: pp };
      if (typeF) filters.type = typeF as any;
      if (monthF) filters.month = monthF;
      if (q) (filters as any).q = q;

      const [txResult, accs, cats] = await Promise.all([
        getTransactions(filters),
        accounts.length ? Promise.resolve(accounts) : getAccounts(),
        categories.length ? Promise.resolve(categories) : getCategories(),
      ]);

      const txData = Array.isArray(txResult) ? txResult : (txResult as any).data ?? [];
      const txTotal = Array.isArray(txResult) ? txResult.length : (txResult as any).total ?? 0;

      setTransactions(txData);
      setTotal(txTotal);
      setPage(p);
      if (!accounts.length) setAccounts(accs);
      if (!categories.length) setCategories(cats);
    } catch (e) { toast.error(getErrorMessage(e)); }
    finally { setIsLoading(false); }
  };

  useEffect(() => {
    void loadTransactions(1, perPage, search, filterType, filterMonth);
  }, [filterType, filterMonth]);

  // Debounced search
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void loadTransactions(1, perPage, search, filterType);
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  const onSubmit = async (data: FormValues) => {
    setIsSaving(true);
    try {
      if (editingTx) {
        await updateTransaction(editingTx.id, { ...data, category_id: data.category_id || undefined });
        toast.success('Transaction updated.');
      } else {
        await createTransaction({ ...data, category_id: data.category_id || undefined });
        toast.success('Transaction added.');
      }
      setDialogOpen(false);
      setEditingTx(null);
      void loadTransactions();
    } catch (e) { toast.error(getErrorMessage(e)); }
    finally { setIsSaving(false); }
  };

  const openEdit = (t: Transaction) => {
    setEditingTx(t);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTransaction(id);
      toast.success('Transaction deleted.');
      void loadTransactions();
    } catch (e) { toast.error(getErrorMessage(e)); }
  };

  const handleExport = async () => {
    try {
      const filters: TransactionFilters = {};
      if (filterType) filters.type = filterType as any;
      if (filterMonth) filters.month = filterMonth;
      if (search) (filters as any).q = search;
      const blob = await exportTransactionsCsv(filters);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transactions${filterMonth ? `_${filterMonth}` : ''}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) { toast.error(getErrorMessage(e)); }
  };

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Transactions</h1>
        <Button className="gap-2" onClick={() => { setEditingTx(null); setDialogOpen(true); }}>
          <Plus size={16} /> Add Transaction
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[160px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9 pr-8"
            placeholder="Search by note or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <Select
          value={filterType}
          onValueChange={(v) => { setFilterType(v); setSearchParams((prev) => { const p = new URLSearchParams(prev); if (v) p.set('type', v); else p.delete('type'); return p; }); }}
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="income">Income</SelectItem>
            <SelectItem value="expense">Expense</SelectItem>
            <SelectItem value="transfer">Transfer</SelectItem>
            <SelectItem value="adjustment">Adjustment</SelectItem>
          </SelectContent>
        </Select>

        <MonthPicker
          value={filterMonth}
          onChange={(v) => { setFilterMonth(v); setSearchParams((prev) => { const p = new URLSearchParams(prev); if (v) p.set('month', v); else p.delete('month'); return p; }); }}
          placeholder="All months"
          clearable
          disableFuture
          className="w-36"
        />

        {(filterType || filterMonth) && (
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground"
            onClick={() => { setFilterType(''); setFilterMonth(''); setSearchParams({}); }}
          >
            <X size={14} /> Clear
          </Button>
        )}

        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 ml-auto"
          onClick={handleExport}
        >
          <Download size={14} /> Export CSV
        </Button>
      </div>

      {/* Transaction list */}
      <div className="rounded-xl border bg-card overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[1,2,3,4,5].map(i => <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />)}
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-14 text-center text-sm text-muted-foreground">No transactions found.</div>
        ) : (
          <div className="divide-y">
            {transactions.map((t) => (
              <div key={t.id} className="flex items-start sm:items-center justify-between px-4 sm:px-5 py-3 sm:py-3 hover:bg-muted/30 transition-colors group gap-3">
                <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                  <div className={`size-8 sm:size-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 sm:mt-0
                    ${t.type === 'income' ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700' : t.type === 'expense' ? 'bg-rose-100 dark:bg-rose-900 text-rose-700' : t.type === 'adjustment' ? 'bg-violet-100 dark:bg-violet-900 text-violet-700' : 'bg-blue-100 dark:bg-blue-900 text-blue-700'}`}>
                    {t.type === 'income' ? '+' : t.type === 'expense' ? '−' : t.type === 'adjustment' ? '±' : '⇄'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{t.type === 'adjustment' ? 'Adjustment' : (t.category?.name ?? 'Uncategorised')}</p>
                    <p className="text-xs text-muted-foreground truncate">{formatDate(t.date)}{t.time ? ` · ${formatTime(t.time)}` : ''} · {t.account?.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                  <span className={`text-xs sm:text-sm font-semibold ${t.type === 'income' ? 'text-emerald-600' : t.type === 'expense' ? 'text-rose-600' : t.type === 'adjustment' ? 'text-violet-600' : 'text-blue-600'}`}>
                    {t.type === 'income' ? '+' : t.type === 'adjustment' ? '±' : '−'}{formatCurrency(t.amount, currency)}
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer">
                        <MoreVertical size={15} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-36">
                      <DropdownMenuItem onClick={() => openEdit(t)} className="cursor-pointer gap-2">
                        <Pencil size={14} /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => void handleDelete(t.id)} className="cursor-pointer gap-2 text-destructive focus:text-destructive">
                        <Trash2 size={14} /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {total > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <span>{total} transaction{total !== 1 ? 's' : ''}</span>
            <span>·</span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs">Rows</span>
              <Select value={String(perPage)} onValueChange={(v) => { setPerPage(Number(v)); void loadTransactions(1, Number(v)); }}>
                <SelectTrigger className="h-7 w-[60px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[10, 20, 50, 100].map((n) => (
                    <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground mr-1">Page {page} of {totalPages}</span>
            <Button size="sm" variant="outline" className="h-7 w-7 p-0" disabled={page <= 1} onClick={() => void loadTransactions(page - 1)}>
              <ChevronLeft size={14} />
            </Button>
            <Button size="sm" variant="outline" className="h-7 w-7 p-0" disabled={page >= totalPages} onClick={() => void loadTransactions(page + 1)}>
              <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      )}

      {/* Add dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditingTx(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingTx ? 'Edit Transaction' : 'Add Transaction'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
            <div className="grid grid-cols-3 gap-1 rounded-lg border p-1 bg-muted">
              {(['expense', 'income', 'transfer'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setValue('type', t)}
                  className={`py-1.5 rounded-md text-sm font-medium capitalize transition-all cursor-pointer
                    ${txType === t ? 'bg-background shadow text-foreground' : 'text-muted-foreground'}`}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="space-y-1">
              <Label>Account</Label>
              <Select onValueChange={(v) => setValue('account_id', v)}>
                <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                </SelectContent>
              </Select>
              {errors.account_id && <p className="text-xs text-destructive">{errors.account_id.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Category</Label>
              <Select onValueChange={(v) => setValue('category_id', v, { shouldValidate: true })}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {categories.filter((c) => c.type === txType || txType === 'transfer').map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category_id && <p className="text-xs text-destructive">{errors.category_id.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                  {getCurrencySymbol(currency)}
                </span>
                <Input type="number" step="0.01" min="0.01" {...register('amount')} placeholder="0.00" className="pl-8" />
              </div>
              {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Date</Label>
                <DatePicker
                  value={watch('date')}
                  onChange={(v) => setValue('date', v, { shouldValidate: true })}
                  disableFuture
                />
                {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
              </div>
              <div className="space-y-1">
                <Label>Time</Label>
                <Input type="time" {...register('time')} className="w-full" />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Note (optional)</Label>
              <Input {...register('note')} placeholder="Add a note..." />
            </div>
            <Button type="submit" className="w-full" disabled={isSaving}>
              {isSaving ? 'Saving...' : editingTx ? 'Update Transaction' : 'Add Transaction'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default TransactionsPage;
