import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { deleteRecurring, getRecurring, storeRecurring } from '@/api/recurring';
import { getAccounts } from '@/api/accounts';
import { getCategories } from '@/api/categories';
import { useAuthStore } from '@/store/authStore';
import { formatCurrency, getErrorMessage } from '@/lib/utils';
import type { Account, Category, RecurringTransaction } from '@/types';

const schema = z.object({
  account_id:  z.string().min(1, 'Required'),
  category_id: z.string().optional(),
  type:        z.enum(['income', 'expense']),
  amount:      z.coerce.number().positive(),
  frequency:   z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  starts_at:   z.string().min(1, 'Required'),
  note:        z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

function RecurringPage() {
  const user = useAuthStore((s) => s.user);
  const currency = user?.currency ?? 'INR';
  const [items, setItems] = useState<RecurringTransaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'expense', frequency: 'monthly', starts_at: new Date().toISOString().split('T')[0] },
  });

  useEffect(() => {
    void (async () => {
      try {
        const [r, a, c] = await Promise.all([getRecurring(), getAccounts(), getCategories()]);
        setItems(r); setAccounts(a); setCategories(c);
      } catch (e) { toast.error(getErrorMessage(e)); }
      finally { setIsLoading(false); }
    })();
  }, []);

  const onSubmit = async (data: FormValues) => {
    setIsSaving(true);
    try {
      const item = await storeRecurring({ ...data, category_id: data.category_id || undefined });
      setItems((prev) => [...prev, item]);
      setDialogOpen(false);
      reset({ type: 'expense', frequency: 'monthly', starts_at: new Date().toISOString().split('T')[0] });
      toast.success('Recurring transaction created.');
    } catch (e) { toast.error(getErrorMessage(e)); }
    finally { setIsSaving(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteRecurring(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      toast.success('Deleted.');
    } catch (e) { toast.error(getErrorMessage(e)); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Recurring</h1>
        <Button className="gap-2" onClick={() => setDialogOpen(true)}>
          <Plus size={16} /> Add Recurring
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />)}</div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-card p-14 text-center text-sm text-muted-foreground">
          No recurring transactions set up yet.
        </div>
      ) : (
        <div className="rounded-xl border bg-card divide-y">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between px-5 py-4 group">
              <div>
                <p className="text-sm font-medium">{item.category?.name ?? 'Uncategorised'} · {item.account?.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{item.frequency} · Next: {item.next_due_at}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-sm font-semibold ${item.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {item.type === 'income' ? '+' : '−'}{formatCurrency(item.amount, currency)}
                </span>
                <button onClick={() => void handleDelete(item.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Add Recurring Transaction</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-1 rounded-lg border p-1 bg-muted">
              {(['expense', 'income'] as const).map((t) => (
                <button key={t} type="button" onClick={() => setValue('type', t)}
                  className={`py-1.5 rounded-md text-sm font-medium capitalize transition-all
                    ${watch('type') === t ? 'bg-background shadow text-foreground' : 'text-muted-foreground'}`}>
                  {t}
                </button>
              ))}
            </div>
            <div className="space-y-1">
              <Label>Account</Label>
              <Select onValueChange={(v) => setValue('account_id', v)}>
                <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
                <SelectContent>{accounts.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
              </Select>
              {errors.account_id && <p className="text-xs text-destructive">{errors.account_id.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Amount</Label>
                <Input type="number" step="0.01" {...register('amount')} placeholder="0.00" />
              </div>
              <div className="space-y-1">
                <Label>Frequency</Label>
                <Select onValueChange={(v) => setValue('frequency', v as any)} defaultValue="monthly">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['daily','weekly','monthly','yearly'].map(f => <SelectItem key={f} value={f} className="capitalize">{f}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Starts On</Label>
              <DatePicker
                value={watch('starts_at')}
                onChange={(v) => setValue('starts_at', v, { shouldValidate: true })}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Create'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default RecurringPage;
