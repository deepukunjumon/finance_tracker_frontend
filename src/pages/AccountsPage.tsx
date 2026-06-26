import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Archive, CreditCard, Edit2, Folder, MoreHorizontal, PiggyBank, Plus, Trash2, TrendingUp, Wallet } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AddAccountDialog } from '@/components/AddAccountDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { adjustByRecord, changeInitialBalance, archiveAccount, deleteAccount, getAccounts } from '@/api/accounts';
import { useAuthStore } from '@/store/authStore';
import { formatCurrency, getErrorMessage } from '@/lib/utils';
import type { Account, AccountType } from '@/types';

const ACCOUNT_TYPE_CONFIG: Record<AccountType, { label: string; Icon: React.ElementType; color: string; bg: string }> = {
  cash:            { label: 'Cash',            Icon: Wallet,     color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950' },
  credit_card:     { label: 'Credit Card',     Icon: CreditCard, color: 'text-rose-600',    bg: 'bg-rose-50 dark:bg-rose-950' },
  savings_account: { label: 'Savings Account', Icon: PiggyBank,  color: 'text-blue-600',    bg: 'bg-blue-50 dark:bg-blue-950' },
  investments:     { label: 'Investments',     Icon: TrendingUp, color: 'text-violet-600',  bg: 'bg-violet-50 dark:bg-violet-950' },
  other:           { label: 'Other',           Icon: Folder,     color: 'text-amber-600',   bg: 'bg-amber-50 dark:bg-amber-950' },
};

type AdjustType = 'adjust_by_record' | 'change_initial_balance';

interface AdjustBalanceDialogProps {
  account:     Account | null;
  currency:    string;
  onClose:     () => void;
  onAdjusted:  (updated: Account) => void;
}

function AdjustBalanceDialog({ account, currency, onClose, onAdjusted }: AdjustBalanceDialogProps) {
  const [adjustType, setAdjustType] = useState<AdjustType>('adjust_by_record');
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (account) {
      setAdjustType('adjust_by_record');
      setValue(String(account.balance));
    }
  }, [account]);

  const handleTypeChange = (type: AdjustType) => {
    setAdjustType(type);
    setValue(type === 'adjust_by_record' ? String(account?.balance ?? 0) : String(account?.initial_balance ?? 0));
  };

  const numValue = parseFloat(value);
  const isValid = !isNaN(numValue);
  const diff = isValid ? numValue - (account?.balance ?? 0) : 0;
  const canSave = isValid && (adjustType === 'change_initial_balance' || diff !== 0);

  const handleSave = async () => {
    if (!account || !canSave) return;
    setSaving(true);
    try {
      const updated = adjustType === 'adjust_by_record'
        ? await adjustByRecord(account.id, numValue)
        : await changeInitialBalance(account.id, numValue);
      onAdjusted(updated);
      onClose();
      toast.success(adjustType === 'adjust_by_record' ? 'Balance adjusted with transaction record.' : 'Initial balance updated.');
    } catch (e) { toast.error(getErrorMessage(e)); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={!!account} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit Balance - {account?.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Method selection */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleTypeChange('adjust_by_record')}
              className={`rounded-lg border p-3 text-left transition-colors cursor-pointer space-y-0.5 ${
                adjustType === 'adjust_by_record' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:border-muted-foreground/30'
              }`}
            >
              <p className="text-xs font-semibold">Adjust by Record</p>
              <p className="text-[10px] text-muted-foreground leading-tight">Creates a transaction</p>
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('change_initial_balance')}
              className={`rounded-lg border p-3 text-left transition-colors cursor-pointer space-y-0.5 ${
                adjustType === 'change_initial_balance' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:border-muted-foreground/30'
              }`}
            >
              <p className="text-xs font-semibold">Change Initial</p>
              <p className="text-[10px] text-muted-foreground leading-tight">No transaction record</p>
            </button>
          </div>

          {/* Current value */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">
              {adjustType === 'adjust_by_record' ? 'Current Balance' : 'Current Initial Balance'}
            </Label>
            <p className="text-sm font-medium">
              {formatCurrency(adjustType === 'adjust_by_record' ? (account?.balance ?? 0) : (account?.initial_balance ?? 0), currency)}
            </p>
          </div>

          {/* Input */}
          <div className="space-y-1">
            <Label>{adjustType === 'adjust_by_record' ? 'New Balance' : 'New Initial Balance'}</Label>
            <Input type="number" step="0.01" value={value} onChange={(e) => setValue(e.target.value)} placeholder="0.00" />
          </div>

          {/* Live preview */}
          {isValid && canSave && (
            adjustType === 'adjust_by_record' ? (
              <div className="rounded-lg bg-muted/50 border p-2.5">
                <p className="text-[10px] text-muted-foreground mb-0.5">Adjustment transaction</p>
                <p className={`text-sm font-semibold ${diff > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {diff > 0 ? '+' : ''}{formatCurrency(diff, currency)}
                </p>
              </div>
            ) : (
              <p className="text-[10px] text-amber-600 dark:text-amber-400">
                This won't create a transaction record.
              </p>
            )
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !canSave}>
            {saving ? 'Saving...' : 'Update'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AccountsPage() {
  const user = useAuthStore((s) => s.user);
  const currency = user?.currency ?? 'INR';
  const [accounts,      setAccounts]      = useState<Account[]>([]);
  const [isLoading,     setIsLoading]     = useState(true);
  const [dialogOpen,    setDialogOpen]    = useState(false);
  const [adjustAccount, setAdjustAccount] = useState<Account | null>(null);

  const fetchAccounts = async () => {
    try {
      setAccounts(await getAccounts());
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { void fetchAccounts(); }, []);

  const handleArchive = async (id: string) => {
    try {
      const updated = await archiveAccount(id);
      setAccounts((prev) => prev.map((a) => a.id === id ? updated : a));
      toast.success('Account updated.');
    } catch (e) { toast.error(getErrorMessage(e)); }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAccount(id);
      setAccounts((prev) => prev.filter((a) => a.id !== id));
      toast.success('Account deleted.');
    } catch (e) { toast.error(getErrorMessage(e)); }
  };

  const totalBalance = accounts.filter((a) => !a.is_archived).reduce((s, a) => s + a.balance, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Accounts</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Total: <span className="font-semibold text-foreground">{formatCurrency(totalBalance, currency)}</span>
          </p>
        </div>
        <Button className="gap-2" onClick={() => setDialogOpen(true)}>
          <Plus size={16} /> Add Account
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1,2,3].map(i => <div key={i} className="h-36 rounded-xl bg-muted animate-pulse" />)}
        </div>
      ) : accounts.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-card p-14 text-center">
          <Wallet className="mx-auto size-10 text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">No accounts yet.</p>
          <Button variant="outline" size="sm" className="mt-3 gap-1.5" onClick={() => setDialogOpen(true)}>
            <Plus size={14} /> Add your first account
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => {
            const config = ACCOUNT_TYPE_CONFIG[account.type];
            const { Icon } = config;
            const accentColor = account.color;
            return (
              <div
                key={account.id}
                className={`rounded-xl border bg-card p-5 flex flex-col gap-4 hover:shadow-sm transition-shadow ${account.is_archived ? 'opacity-60' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div
                    className="flex size-10 items-center justify-center rounded-lg"
                    style={accentColor
                      ? { backgroundColor: accentColor + '22', color: accentColor }
                      : undefined
                    }
                  >
                    <Icon className={`size-5 ${!accentColor ? config.color : ''}`} />
                  </div>
                  <div className="flex items-center gap-1">
                    {account.is_archived && (
                      <span className="text-xs text-muted-foreground border rounded-full px-2 py-0.5">Archived</span>
                    )}
                    <span className="text-xs text-muted-foreground rounded-full border px-2 py-0.5">
                      {config.label}
                    </span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreHorizontal size={15} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setAdjustAccount(account)}>
                          <Edit2 size={14} className="mr-2" /> Edit Balance
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => void handleArchive(account.id)}>
                          <Archive size={14} className="mr-2" />
                          {account.is_archived ? 'Unarchive' : 'Archive'}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => void handleDelete(account.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 size={14} className="mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-0.5">{account.name}</p>
                  <p className="text-xl font-bold tracking-tight">{formatCurrency(account.balance, currency)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AddAccountDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreated={(acc) => setAccounts((prev) => [...prev, acc])}
      />

      <AdjustBalanceDialog
        account={adjustAccount}
        currency={currency}
        onClose={() => setAdjustAccount(null)}
        onAdjusted={(updated) => setAccounts((prev) => prev.map((a) => a.id === updated.id ? updated : a))}
      />
    </div>
  );
}

export default AccountsPage;
