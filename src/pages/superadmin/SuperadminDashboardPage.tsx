import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Shield, Tag, Users, Wallet } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { api } from '@/api/axios';
import { getErrorMessage } from '@/lib/utils';

interface SuperadminStats {
  total_users: number;
  active_users: number;
  total_transactions: number;
  recent_users: { id: string; name: string; email: string; created_at: string; role: string }[];
}

function SuperadminDashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<SuperadminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const res = await api.get<{ data: SuperadminStats }>('/superadmin/dashboard');
        setStats(res.data.data);
      } catch (e) { toast.error(getErrorMessage(e)); }
      finally { setIsLoading(false); }
    })();
  }, []);

  const navCards = [
    { label: 'Users',         to: '/superadmin/users',         icon: Users },
    { label: 'Currencies',    to: '/superadmin/currencies',    icon: Wallet },
    { label: 'Account Types', to: '/superadmin/account-types', icon: Wallet },
    { label: 'Categories',    to: '/superadmin/categories',    icon: Tag },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="text-amber-500" size={24} />
        <h1 className="text-2xl font-bold">Superadmin Panel</h1>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4">{[1,2,3].map(i => <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />)}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Total Users',        value: stats?.total_users ?? 0 },
            { label: 'Active Users',       value: stats?.active_users ?? 0 },
            { label: 'Total Transactions', value: stats?.total_transactions ?? 0 },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl border bg-card p-5">
              <p className="text-xs text-muted-foreground mb-1">{label}</p>
              <p className="text-2xl font-bold">{value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {navCards.map(({ label, to, icon: Icon }) => (
          <button key={to} onClick={() => navigate(to)}
            className="rounded-xl border bg-card p-5 text-left hover:bg-muted/30 transition-colors">
            <Icon size={20} className="text-amber-500 mb-2" />
            <p className="text-sm font-medium">{label}</p>
          </button>
        ))}
      </div>

      {stats && stats.recent_users.length > 0 && (
        <div className="rounded-xl border bg-card p-5">
          <h3 className="text-sm font-semibold mb-4">Recent Users</h3>
          <div className="divide-y">
            {stats.recent_users.map((u) => (
              <div key={u.id} className="flex items-center justify-between py-2.5">
                <div>
                  <p className="text-sm font-medium">{u.name}</p>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                </div>
                <span className="text-xs text-muted-foreground">{new Date(u.created_at).toISOString().split('T')[0] }</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default SuperadminDashboardPage;
