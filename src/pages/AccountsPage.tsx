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
import { adjustBalance, archiveAccount, deleteAccount, getAccounts } from '@/api/accounts';
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

interface AdjustBalanceDialogProps {
  account:     Account | null;
  currency:    string;
  onClose:     () => void;
  onAdjusted:  (updated: Account) => void;
}

function AdjustBalanceDialog({ account, currency, onClose, onAdjusted }: AdjustBalanceDialogProps) {
  const [value,   setValue]   = useState('');
  const [saving,  setSaving]  = useState(false);

  useEffect(() => {
    if (account) setValue(String(account.balance));
  }, [account]);

  const handleSave = async () => {
    if (!account) return;
    const num = parseFloat(value);
    if (isNaN(num)) { toast.error('Enter a valid number.'); return; }
    setSaving(true);
    try {
      const updated = await adjustBalance(account.id, num);
      onAdjusted(updated);
      onClose();
      toast.success('Balance updated.');
    } catch (e) { toast.error(getErrorMessage(e)); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={!!account} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>Edit Balance</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <Label>Account</Label>
            <p className="text-sm font-medium">{account?.name}</p>
          </div>
          <div className="space-y-1">
            <Label>Current balance</Label>
            <p className="text-sm text-muted-foreground">{formatCurrency(account?.balance ?? 0, currency)}</p>
          </div>
          <div className="space-y-1">
            <Label>New balance</Label>
            <Input
              type="number"
              step="0.01"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="0.00"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Update Balance'}
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
                className={`rounded-xl border bg-card p-5 flex flex-col gap-4 hover:shadow-sm transition-all cursor-default ${account.is_archived ? 'opacity-60' : ''}`}
                style={accentColor ? { borderLeftColor: accentColor, borderLeftWidth: 3 } : undefined}
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
                  <p className="text-xs text-muted-foreground mt-1">{config.label}</p>
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
