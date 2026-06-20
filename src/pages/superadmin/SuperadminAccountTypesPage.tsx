import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { api } from '@/api/axios';
import { getErrorMessage } from '@/lib/utils';
import type { AccountTypeMaster } from '@/types';

function SuperadminAccountTypesPage() {
  const [types, setTypes] = useState<AccountTypeMaster[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: '', slug: '', icon: 'wallet', color: '#6366f1' });
  const [isSaving, setIsSaving] = useState(false);

  const fetchTypes = async () => {
    try {
      const res = await api.get<{ data: AccountTypeMaster[] }>('/superadmin/account-types');
      setTypes(res.data.data);
    } catch (e) { toast.error(getErrorMessage(e)); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { void fetchTypes(); }, []);

  const handleCreate = async () => {
    setIsSaving(true);
    try {
      await api.post('/superadmin/account-types', form);
      await fetchTypes();
      setDialogOpen(false);
      setForm({ name: '', slug: '', icon: 'wallet', color: '#6366f1' });
      toast.success('Account type added.');
    } catch (e) { toast.error(getErrorMessage(e)); }
    finally { setIsSaving(false); }
  };

  const handleToggle = async (id: string, is_active: boolean) => {
    try {
      await api.put(`/superadmin/account-types/${id}`, { is_active: !is_active });
      await fetchTypes();
    } catch (e) { toast.error(getErrorMessage(e)); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Account Types</h1>
        <Button className="gap-2" onClick={() => setDialogOpen(true)}>
          <Plus size={16} /> Add Type
        </Button>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">{[1,2,3].map(i => <div key={i} className="h-10 rounded bg-muted animate-pulse" />)}</div>
        ) : (
          <div className="divide-y">
            {types.map((t) => (
              <div key={t.id} className={`flex items-center justify-between px-5 py-3 ${!t.is_active ? 'opacity-50' : ''}`}>
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: t.color }}>{t.name[0]}</div>
                  <div>
                    <p className="text-sm font-medium">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.slug}</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="h-7 text-xs"
                  onClick={() => void handleToggle(t.id, t.is_active)}>
                  {t.is_active ? 'Disable' : 'Enable'}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Add Account Type</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Savings Account" />
            </div>
            <div className="space-y-1">
              <Label>Slug</Label>
              <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, '_') })} placeholder="savings_account" />
            </div>
            <div className="space-y-1">
              <Label>Color</Label>
              <Input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="h-9 px-1 py-1" />
            </div>
            <Button className="w-full" onClick={handleCreate} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Add Type'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default SuperadminAccountTypesPage;
