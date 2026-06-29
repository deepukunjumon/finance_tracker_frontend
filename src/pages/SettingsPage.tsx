import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Bell, Download, Info, Lock, Moon, Palette, Sun } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { getPublicSettings } from '@/api/settings';
import { getCurrencySymbol, getErrorMessage } from '@/lib/utils';
import { updateProfile, getNotificationPreferences, updateNotificationPreferences, getUserPreferences, updateUserPreferences, type NotificationPreferences, type UserPreferences } from '@/api/profile';
import { exportTransactionsCsv } from '@/api/transactions';

const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD', 'AUD', 'CAD', 'JPY', 'CHF', 'CNY', 'MYR'];
const DATE_FORMATS = [
  { value: 'd MMM yyyy', label: '21 Jun 2026' },
  { value: 'dd/MM/yyyy', label: '21/06/2026' },
  { value: 'MM/dd/yyyy', label: '06/21/2026' },
  { value: 'yyyy-MM-dd', label: '2026-06-21' },
];
const WEEK_STARTS = [
  { value: 'sunday', label: 'Sunday' },
  { value: 'monday', label: 'Monday' },
];

const DEFAULT_APP_PREFS: UserPreferences = {
  date_format: 'd MMM yyyy',
  default_account_id: '',
  week_start: 'sunday',
};

const DEFAULT_NOTIF_PREFS: NotificationPreferences = {
  email: true, sms: false, push: true,
  budget_alerts: true, transaction_alerts: true,
  weekly_summary: false, bill_reminders: true,
};

function SettingsPage() {
  const { user, updateUser } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const [appVersion, setAppVersion] = useState('');
  const [appName, setAppName] = useState('');

  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferences>(DEFAULT_NOTIF_PREFS);
  const [notifLoading, setNotifLoading] = useState(true);
  const [appPrefs, setAppPrefs] = useState<UserPreferences>(DEFAULT_APP_PREFS);
  const [_prefsLoading, setPrefsLoading] = useState(true);
  const [currency, setCurrency] = useState(user?.currency ?? 'INR');
  const [isSavingCurrency, setIsSavingCurrency] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    void getPublicSettings().then((s) => { setAppVersion(s.app_version); setAppName(s.app_name); });
    void getNotificationPreferences()
      .then(setNotifPrefs)
      .catch(() => {})
      .finally(() => setNotifLoading(false));
    void getUserPreferences()
      .then(setAppPrefs)
      .catch(() => {})
      .finally(() => setPrefsLoading(false));
  }, []);

  const handleNotifToggle = async (key: keyof NotificationPreferences, value: boolean) => {
    const updated = { ...notifPrefs, [key]: value };
    setNotifPrefs(updated);
    try {
      await updateNotificationPreferences(updated);
      toast.success('Preference updated.');
    } catch (e) {
      setNotifPrefs(notifPrefs);
      toast.error(getErrorMessage(e));
    }
  };

  const updateAppPref = async (key: keyof UserPreferences, value: string) => {
    const updated = { ...appPrefs, [key]: value };
    setAppPrefs(updated);
    try {
      await updateUserPreferences({ [key]: value });
      if (user) updateUser({ ...user, preferences: updated });
    } catch (e) {
      setAppPrefs(appPrefs);
      toast.error(getErrorMessage(e));
    }
  };

  const handleCurrencyChange = async (c: string) => {
    setCurrency(c);
    setIsSavingCurrency(true);
    try {
      const updated = await updateProfile({ name: user?.name ?? '', currency: c });
      updateUser(updated);
      toast.success('Currency updated.');
    } catch (e) { toast.error(getErrorMessage(e)); }
    finally { setIsSavingCurrency(false); }
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const blob = await exportTransactionsCsv({});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'cashlytics_data_export.csv';
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Data exported.');
    } catch (e) { toast.error(getErrorMessage(e)); }
    finally { setIsExporting(false); }
  };

  const notifItems: { key: keyof NotificationPreferences; label: string; description: string }[] = [
    { key: 'email',              label: 'Email Notifications',   description: 'Receive notifications via email' },
    { key: 'sms',                label: 'SMS Notifications',     description: 'Receive notifications via SMS' },
    { key: 'push',               label: 'Push Notifications',    description: 'Browser push notifications' },
    { key: 'budget_alerts',      label: 'Budget Alerts',         description: 'Alert when budget limit is approaching or exceeded' },
    { key: 'transaction_alerts', label: 'Transaction Alerts',    description: 'Alert for large or unusual transactions' },
    { key: 'weekly_summary',     label: 'Weekly Summary',        description: 'Receive a weekly spending summary email' },
    { key: 'bill_reminders',     label: 'Bill Reminders',        description: 'Reminders for upcoming recurring bills' },
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* Notification Preferences */}
      <div className="rounded-xl border bg-card p-6 space-y-5">
        <div className="flex items-center gap-2">
          <Bell size={16} className="text-muted-foreground" />
          <h2 className="text-base font-semibold">Notification Preferences</h2>
        </div>
        {notifLoading ? (
          <div className="space-y-4">
            {[1,2,3,4].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="space-y-1.5 flex-1">
                  <div className="h-3.5 bg-muted rounded animate-pulse w-32" />
                  <div className="h-3 bg-muted rounded animate-pulse w-48" />
                </div>
                <div className="h-5 w-9 bg-muted rounded-full animate-pulse" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {notifItems.map(({ key, label, description }) => (
              <div key={key} className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
                <Switch
                  checked={notifPrefs[key]}
                  onCheckedChange={(v) => void handleNotifToggle(key, v)}
                  className="cursor-pointer shrink-0"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preferences */}
      <div className="rounded-xl border bg-card p-6 space-y-5">
        <div className="flex items-center gap-2">
          <Palette size={16} className="text-muted-foreground" />
          <h2 className="text-base font-semibold">Preferences</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>Default Currency</Label>
            <Select value={currency} onValueChange={handleCurrencyChange} disabled={isSavingCurrency}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c} value={c}>{getCurrencySymbol(c)} {c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Date Format</Label>
            <Select value={appPrefs.date_format} onValueChange={(v) => updateAppPref('date_format', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {DATE_FORMATS.map((f) => (
                  <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Theme</Label>
            <Select value={theme} onValueChange={(v) => setTheme(v as 'light' | 'dark')}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="light"><span className="flex items-center gap-2"><Sun size={14} /> Light</span></SelectItem>
                <SelectItem value="dark"><span className="flex items-center gap-2"><Moon size={14} /> Dark</span></SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Week Starts On</Label>
            <Select value={appPrefs.week_start} onValueChange={(v) => updateAppPref('week_start', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {WEEK_STARTS.map((w) => (
                  <SelectItem key={w.value} value={w.value}>{w.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Privacy */}
      <div className="rounded-xl border bg-card p-6 space-y-5">
        <div className="flex items-center gap-2">
          <Lock size={16} className="text-muted-foreground" />
          <h2 className="text-base font-semibold">Privacy</h2>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Export Your Data</p>
              <p className="text-xs text-muted-foreground">Download all your transactions as a CSV file</p>
            </div>
            <Button variant="outline" size="sm" className="gap-1.5 shrink-0" onClick={handleExportData} disabled={isExporting}>
              <Download size={14} /> {isExporting ? 'Exporting...' : 'Export'}
            </Button>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Connected Sessions</p>
              <p className="text-xs text-muted-foreground">SSO and OAuth provider connections</p>
            </div>
            <span className="text-xs text-muted-foreground shrink-0">No active sessions</span>
          </div>
        </div>
      </div>

      {/* About */}
      <div className="rounded-xl border bg-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Info size={16} className="text-muted-foreground" />
          <h2 className="text-base font-semibold">About</h2>
        </div>
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">App Name</span>
            <span className="font-medium">{appName || 'Cashlytics'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Version</span>
            <span className="font-mono text-xs">{appVersion || '—'}</span>
          </div>
          <div className="border-t pt-3 flex gap-4">
            <a href="#" className="text-xs text-primary hover:underline">Terms of Service</a>
            <a href="#" className="text-xs text-primary hover:underline">Privacy Policy</a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
