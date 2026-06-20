import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';
import { FAB } from '@/components/FAB';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
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
import { createTransaction, deleteTransaction, getTransactions } from '@/api/transactions';
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
  const currency = user?.currency ?? 'INR';
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: 'expense',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
    },
  });
  const txType = watch('type');

  useEffect(() => {
    void (async () => {
      try {
        const [txs, accs, cats] = await Promise.all([getTransactions(), getAccounts(), getCategories()]);
        setTransactions(Array.isArray(txs) ? txs : (txs as any).data ?? []);
        setAccounts(accs);
        setCategories(cats);
      } catch (e) { toast.error(getErrorMessage(e)); }
      finally { setIsLoading(false); }
    })();
  }, []);

  const onSubmit = async (data: FormValues) => {
    setIsSaving(true);
    try {
      const tx = await createTransaction({ ...data, category_id: data.category_id || undefined });
      setTransactions((prev) => [tx, ...prev]);
      setDialogOpen(false);
      reset({ type: 'expense', date: new Date().toISOString().split('T')[0] });
      toast.success('Transaction added.');
    } catch (e) { toast.error(getErrorMessage(e)); }
    finally { setIsSaving(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTransaction(id);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      toast.success('Transaction deleted.');
    } catch (e) { toast.error(getErrorMessage(e)); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Transactions</h1>
        <Button className="gap-2" onClick={() => setDialogOpen(true)}>
          <Plus size={16} /> Add Transaction
        </Button>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[1,2,3,4].map(i => <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />)}
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-14 text-center text-sm text-muted-foreground">No transactions yet.</div>
        ) : (
          <div className="divide-y">
            {transactions.map((t) => (
              <div key={t.id} className="flex items-center justify-between px-5 py-3 hover:bg-muted/30 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className={`size-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                    ${t.type === 'income' ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700' : t.type === 'expense' ? 'bg-rose-100 dark:bg-rose-900 text-rose-700' : 'bg-blue-100 dark:bg-blue-900 text-blue-700'}`}>
                    {t.type === 'income' ? '+' : t.type === 'expense' ? '−' : '⇄'}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{t.category?.name ?? 'Uncategorised'}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(t.date)}{t.time ? ` · ${formatTime(t.time)}` : ''} · {t.account?.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-semibold ${t.type === 'income' ? 'text-emerald-600' : t.type === 'expense' ? 'text-rose-600' : 'text-blue-600'}`}>
                    {t.type === 'income' ? '+' : '−'}{formatCurrency(t.amount, currency)}
                  </span>
                  <button
                    onClick={() => void handleDelete(t.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Transaction</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
            <div className="grid grid-cols-3 gap-1 rounded-lg border p-1 bg-muted">
              {(['expense', 'income', 'transfer'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setValue('type', t)}
                  className={`py-1.5 rounded-md text-sm font-medium capitalize transition-all
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
              {isSaving ? 'Saving...' : 'Add Transaction'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default TransactionsPage;
