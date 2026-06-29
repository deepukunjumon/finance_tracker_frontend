import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { createTransaction } from '@/api/transactions';
import { getAccounts } from '@/api/accounts';
import { getCategories } from '@/api/categories';
import { useAuthStore } from '@/store/authStore';
import { getCurrencySymbol, getErrorMessage } from '@/lib/utils';
import { DatePicker } from '@/components/ui/date-picker';
import type { Account, Category, Transaction } from '@/types';

const schema = z.object({
  account_id:  z.string().min(1, 'Account is required'),
  category_id: z.string().min(1, 'Category is required'),
  type:        z.enum(['income', 'expense', 'transfer']),
  amount:      z.coerce.number().positive('Must be positive'),
  date:        z.string().min(1, 'Date is required'),
  time:        z.string().optional(),
  note:        z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface AddTransactionDialogProps {
  open:          boolean;
  onOpenChange:  (open: boolean) => void;
  onCreated?:    (tx: Transaction) => void;
}

export function AddTransactionDialog({ open, onOpenChange, onCreated }: AddTransactionDialogProps) {
  const user = useAuthStore((s) => s.user);
  const [accounts,   setAccounts]   = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSaving,   setIsSaving]   = useState(false);

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
    account_id: user?.preferences?.default_account_id ?? '',
    category_id: '',
    amount: undefined as any,
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    note: '',
  });

  useEffect(() => {
    if (open) {
      reset(freshDefaults());
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    void (async () => {
      try {
        const [accs, cats] = await Promise.all([getAccounts(), getCategories()]);
        setAccounts(accs);
        setCategories(cats);
      } catch (e) { toast.error(getErrorMessage(e)); }
    })();
  }, [open]);

  const onSubmit = async (data: FormValues) => {
    setIsSaving(true);
    try {
      const tx = await createTransaction(data);
      onCreated?.(tx);
      onOpenChange(false);
      toast.success('Transaction added.');
    } catch (e) { toast.error(getErrorMessage(e)); }
    finally { setIsSaving(false); }
  };

  const filteredCategories = categories.filter((c) =>
    txType === 'transfer' ? true : c.type === txType
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Transaction</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          {/* Type toggle */}
          <div className="grid grid-cols-3 gap-1 rounded-lg border p-1 bg-muted">
            {(['expense', 'income', 'transfer'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setValue('type', t)}
                className={`py-1.5 rounded-md text-sm font-medium capitalize transition-all cursor-pointer
                  ${txType === t ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Account */}
            <div className="space-y-1">
              <Label>Account</Label>
              <Select onValueChange={(v) => setValue('account_id', v)}>
                <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.account_id && <p className="text-xs text-destructive">{errors.account_id.message}</p>}
            </div>

            {/* Category */}
            <div className="space-y-1">
              <Label>Category</Label>
              <Select onValueChange={(v) => setValue('category_id', v, { shouldValidate: true })}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {filteredCategories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category_id && <p className="text-xs text-destructive">{errors.category_id.message}</p>}
            </div>
          </div>

          {/* Amount */}
          <div className="space-y-1">
            <Label>Amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                {getCurrencySymbol(user?.currency)}
              </span>
              <Input type="number" step="0.01" min="0.01" {...register('amount')} placeholder="0.00" className="pl-8" />
            </div>
            {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
          </div>

          {/* Date + Time */}
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

          {/* Note */}
          <div className="space-y-1">
            <Label>Note <span className="text-muted-foreground">(optional)</span></Label>
            <Input {...register('note')} placeholder="Add a note..." />
          </div>

          <Button type="submit" className="w-full" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Add Transaction'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
