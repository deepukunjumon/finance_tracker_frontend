import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
  Download,
  Folder,
  MoreVertical,
  PiggyBank,
  Plus,
  TrendingUp,
  Wallet,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MonthPicker } from "@/components/ui/date-picker";
import { AddAccountDialog } from "@/components/AddAccountDialog";
import { ChartEmptyState } from "@/components/ChartEmptyState";
import { CustomTooltip } from "@/components/CustomTooltip";
import { FAB } from "@/components/FAB";
import { getDashboardStats } from "@/api/dashboard";
import { useAuthStore } from "@/store/authStore";
import { formatCurrency, formatDate, formatTime, getErrorMessage } from "@/lib/utils";
import type { Account, AccountType, DashboardStats } from "@/types";

const ACCOUNT_TYPE_CONFIG: Record<
  AccountType,
  { label: string; Icon: React.ElementType; color: string; bg: string }
> = {
  cash: {
    label: "Cash",
    Icon: Wallet,
    color: "text-emerald-600",
    bg: "bg-emerald-50 dark:bg-emerald-950",
  },
  credit_card: {
    label: "Credit Card",
    Icon: CreditCard,
    color: "text-rose-600",
    bg: "bg-rose-50 dark:bg-rose-950",
  },
  savings_account: {
    label: "Savings Account",
    Icon: PiggyBank,
    color: "text-blue-600",
    bg: "bg-blue-50 dark:bg-blue-950",
  },
  investments: {
    label: "Investments",
    Icon: TrendingUp,
    color: "text-violet-600",
    bg: "bg-violet-50 dark:bg-violet-950",
  },
  other: {
    label: "Other",
    Icon: Folder,
    color: "text-amber-600",
    bg: "bg-amber-50 dark:bg-amber-950",
  },
};

const CHART_COLORS = [
  "#6366f1",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#3b82f6",
  "#ec4899",
  "#14b8a6",
  "#8b5cf6",
];

function StatCard({
  label,
  value,
  icon,
  color,
  onClick,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  onClick?: () => void;
}) {
  return (
    <div
      className={`rounded-xl border bg-card p-3 sm:p-5 flex items-center gap-2.5 sm:gap-4 ${onClick ? 'cursor-pointer hover:shadow-sm transition-shadow' : ''}`}
      onClick={onClick}
    >
      <div
        className={`flex size-8 sm:size-10 items-center justify-center rounded-lg shrink-0 ${color}`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        <p className="text-sm sm:text-xl font-bold tracking-tight truncate">{value}</p>
      </div>
    </div>
  );
}

function AccountCard({
  account,
  currency,
}: {
  account: Account;
  currency: string;
}) {
  const config = ACCOUNT_TYPE_CONFIG[account.type];
  const { Icon } = config;
  return (
    <div className="rounded-xl border bg-card p-5 flex flex-col gap-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between">
        <div
          className="flex size-10 items-center justify-center rounded-lg"
          style={
            account.color
              ? { backgroundColor: account.color + "22", color: account.color }
              : undefined
          }
        >
          <Icon className={`size-5 ${!account.color ? config.color : ""}`} />
        </div>
        <span className="text-xs text-muted-foreground rounded-full border px-2 py-0.5">
          {config.label}
        </span>
      </div>
      <div>
        <p className="text-sm text-muted-foreground mb-0.5">{account.name}</p>
        <p className="text-xl font-bold tracking-tight">
          {formatCurrency(account.balance, currency)}
        </p>
      </div>
    </div>
  );
}

async function downloadCardAsImage(container: HTMLElement, filename: string) {
  const { toPng } = await import('html-to-image');
  try {
    const dataUrl = await toPng(container, {
      pixelRatio: 2,
      backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--background').trim()
        ? (document.documentElement.classList.contains('dark') ? '#1a1a1a' : '#ffffff')
        : '#ffffff',
      filter: (node) => {
        if (node instanceof HTMLElement && node.hasAttribute('data-download-hide')) return false;
        return true;
      },
    });
    const a = document.createElement('a');
    a.download = filename;
    a.href = dataUrl;
    a.click();
  } catch {
    // fallback silently
  }
}

const DASHBOARD_SECTIONS_KEY = 'cashlytics_dashboard_sections';

interface DashboardSections {
  accounts: boolean;
  recent_transactions: boolean;
  monthly_trend: boolean;
  expense_by_category: boolean;
  income_by_category: boolean;
  balance_trend: boolean;
}

const DEFAULT_SECTIONS: DashboardSections = {
  accounts: true,
  recent_transactions: true,
  monthly_trend: true,
  expense_by_category: true,
  income_by_category: true,
  balance_trend: true,
};

const SECTION_LABELS: Record<keyof DashboardSections, string> = {
  accounts: 'My Accounts',
  monthly_trend: 'Income vs Expense Chart',
  income_by_category: 'Income by Category',
  expense_by_category: 'Expense by Category',
  balance_trend: 'Balance Trend',
  recent_transactions: 'Recent Transactions',
};

function loadSections(): DashboardSections {
  try {
    const stored = localStorage.getItem(DASHBOARD_SECTIONS_KEY);
    if (stored) return { ...DEFAULT_SECTIONS, ...JSON.parse(stored) };
  } catch {}
  return DEFAULT_SECTIONS;
}

function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [sections, setSections] = useState<DashboardSections>(loadSections);
  const currency = user?.currency ?? "INR";

  const barChartRef = useRef<HTMLDivElement>(null);
  const expensePieRef = useRef<HTMLDivElement>(null);
  const categoryPieRef = useRef<HTMLDivElement>(null);
  const balanceTrendRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async (month?: string, showSkeleton = true) => {
    if (showSkeleton) setIsLoading(true);
    try {
      setStats(await getDashboardStats(month || undefined));
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleSection = (key: keyof DashboardSections) => {
    const updated = { ...sections, [key]: !sections[key] };
    setSections(updated);
    localStorage.setItem(DASHBOARD_SECTIONS_KEY, JSON.stringify(updated));
  };

  const handleMonthChange = async (v: string) => {
    setSelectedMonth(v);
    setChartLoading(true);
    try {
      const monthStats = await getDashboardStats(v || undefined);
      setStats((prev) => prev ? {
        ...prev,
        monthly_income:       monthStats.monthly_income,
        monthly_expense:      monthStats.monthly_expense,
        monthly_trend:        monthStats.monthly_trend,
        expense_by_category:  monthStats.expense_by_category,
        income_by_category:   monthStats.income_by_category,
        balance_trend:        monthStats.balance_trend,
      } : monthStats);
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setChartLoading(false);
    }
  };

  const trendData = (() => {
    if (!stats) return [];
    const map: Record<
      string,
      { month: string; Income: number; Expense: number }
    > = {};
    stats.monthly_trend.forEach(({ month, type, total }) => {
      if (!map[month]) map[month] = { month, Income: 0, Expense: 0 };
      if (type === "income") map[month].Income = Number(total);
      if (type === "expense") map[month].Expense = Number(total);
    });
    return Object.values(map);
  })();

  const expensePieData =
    stats?.expense_by_category.map((e) => ({
      name: e.category?.name ?? "Uncategorised",
      value: Number(e.total),
      color: e.category?.color ?? null,
    })) ?? [];

  const incomePieData =
    stats?.income_by_category?.map((e) => ({
      name: e.category?.name ?? "Uncategorised",
      value: Number(e.total),
      color: e.category?.color ?? null,
    })) ?? [];

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-28 rounded-2xl bg-muted" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-20 rounded-xl bg-muted" />
          <div className="h-20 rounded-xl bg-muted" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dashboard header with customize menu */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer" aria-label="Customize dashboard">
              <MoreVertical size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 p-3 space-y-2.5" onCloseAutoFocus={(e) => e.preventDefault()}>
            <p className="text-xs font-semibold text-muted-foreground mb-1">Show on dashboard</p>
            <label className="flex items-center gap-2.5 cursor-pointer group border-b border-border pb-2 mb-1">
              <Checkbox
                checked={Object.values(sections).every(Boolean)}
                onCheckedChange={(checked) => {
                  const val = !!checked;
                  const updated = Object.fromEntries(Object.keys(sections).map((k) => [k, val])) as unknown as DashboardSections;
                  setSections(updated);
                  localStorage.setItem(DASHBOARD_SECTIONS_KEY, JSON.stringify(updated));
                }}
                className="cursor-pointer"
              />
              <span className="text-sm font-medium group-hover:text-foreground transition-colors">Select All</span>
            </label>
            {(Object.keys(SECTION_LABELS) as (keyof DashboardSections)[]).map((key) => (
              <label key={key} className="flex items-center gap-2.5 cursor-pointer group">
                <Checkbox
                  checked={sections[key]}
                  onCheckedChange={() => toggleSection(key)}
                  className="cursor-pointer"
                />
                <span className="text-sm group-hover:text-foreground transition-colors">{SECTION_LABELS[key]}</span>
              </label>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Balance banner */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 dark:from-slate-700 dark:via-slate-800 dark:to-slate-900 px-6 py-7 text-white relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 0h20v20H0z\' fill=\'none\'/%3E%3Cpath d=\'M0 10h20M10 0v20\' stroke=\'%23fff\' stroke-width=\'.5\'/%3E%3C/svg%3E")' }}
        />
        <div className="pointer-events-none absolute -top-8 -right-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-6 -left-6 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <p className="text-sm text-white/60 mb-1 relative">Total balance</p>
        <p className="text-3xl font-bold tracking-tight relative">
          {formatCurrency(stats?.total_balance ?? 0, currency)}
        </p>
        <p className="text-xs text-white/50 mt-2 relative">
          Across {stats?.accounts.length ?? 0}{" "}
          {stats?.accounts.length === 1 ? "account" : "accounts"}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard
          label="Monthly Income"
          value={formatCurrency(stats?.monthly_income ?? 0, currency)}
          icon={<ArrowDownLeft size={18} className="text-emerald-600" />}
          color="bg-emerald-50 dark:bg-emerald-950"
          onClick={() => {
            const m = selectedMonth || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
            navigate(`/transactions?type=income&month=${m}`);
          }}
        />
        <StatCard
          label="Monthly Expense"
          value={formatCurrency(stats?.monthly_expense ?? 0, currency)}
          icon={<ArrowUpRight size={18} className="text-rose-600" />}
          color="bg-rose-50 dark:bg-rose-950"
          onClick={() => {
            const m = selectedMonth || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
            navigate(`/transactions?type=expense&month=${m}`);
          }}
        />
      </div>

      {/* Accounts */}
      {sections.accounts && <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold">My Accounts</h2>
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => setDialogOpen(true)}
          >
            <Plus size={14} />
            Add account
          </Button>
        </div>
        {(stats?.accounts.length ?? 0) === 0 ? (
          <div className="rounded-xl border border-dashed bg-card p-10 text-center">
            <p className="text-sm text-muted-foreground">No accounts yet.</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3 gap-1.5"
              onClick={() => setDialogOpen(true)}
            >
              <Plus size={14} /> Add your first account
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            {stats?.accounts.map((account) => (
              <AccountCard
                key={account.id}
                account={account}
                currency={currency}
              />
            ))}
          </div>
        )}
      </div>}

      {/* Month picker shared across charts */}
      {(sections.monthly_trend || sections.balance_trend || sections.expense_by_category || sections.income_by_category) && <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Charts & Insights</h2>
        <MonthPicker
          value={selectedMonth}
          onChange={handleMonthChange}
          placeholder="This month"
          clearable
          disableFuture
          className="h-8 w-40 text-xs"
        />
      </div>}

      {/* Charts row */}
      {(sections.monthly_trend || sections.balance_trend || sections.expense_by_category || sections.income_by_category) && <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 transition-opacity ${chartLoading ? 'opacity-50 pointer-events-none' : ''}`}>
        {/* Income vs Expense trend */}
        {sections.monthly_trend && <div ref={barChartRef} className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">Income vs Expense</h3>
            {trendData.length > 0 && (
              <Button
                data-download-hide
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs h-7 cursor-pointer"
                onClick={() => barChartRef.current && downloadCardAsImage(barChartRef.current, "income_vs_expense.png")}
              >
                <Download size={13} /> Download
              </Button>
            )}
          </div>
          {trendData.length === 0 ? (
            <ChartEmptyState />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={trendData} barSize={16} barGap={4}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={50}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  content={<CustomTooltip prefix="₹" />}
                  cursor={{ fill: "var(--muted)", opacity: 0.5 }}
                />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Income" fill="#22c55e" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Expense" fill="#ef4444" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>}

        {/* Balance Trend */}
        {sections.balance_trend && <div ref={balanceTrendRef} className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">Balance Trend</h3>
            {(stats?.balance_trend?.length ?? 0) > 0 && (
              <Button
                data-download-hide
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs h-7 cursor-pointer"
                onClick={() => balanceTrendRef.current && downloadCardAsImage(balanceTrendRef.current, "balance_trend.png")}
              >
                <Download size={13} /> Download
              </Button>
            )}
          </div>
          {!stats?.balance_trend?.length ? (
            <ChartEmptyState message="No balance data this month" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={stats.balance_trend.map((d) => ({ ...d, balance: Number(d.balance) }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={55} domain={[0, 'auto']} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip prefix="₹" />} cursor={{ stroke: "var(--muted-foreground)", strokeWidth: 1, strokeDasharray: "4 4" }} />
                <Line type="monotone" dataKey="balance" name="Balance" stroke="#4287f5" strokeWidth={2.5} dot={{ r: 3, fill: "#4287f5", strokeWidth: 0 }} activeDot={{ r: 5, fill: "#6366f1", strokeWidth: 2, stroke: "#fff" }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>}

        {/* Income by category */}
        {sections.income_by_category && <div ref={categoryPieRef} className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">Income by Category</h3>
            {incomePieData.length > 0 && (
              <Button
                data-download-hide
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs h-7 cursor-pointer"
                onClick={() => categoryPieRef.current && downloadCardAsImage(categoryPieRef.current, "income_by_category.png")}
              >
                <Download size={13} /> Download
              </Button>
            )}
          </div>
          {incomePieData.length === 0 ? (
            <ChartEmptyState message="No income data this month" />
          ) : (
            <div>
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <ResponsiveContainer width={160} height={160}>
                    <PieChart>
                      <Pie data={incomePieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={52} outerRadius={72} paddingAngle={3} strokeWidth={0}>
                        {incomePieData.map((d, i) => (
                          <Cell key={i} fill={d.color || CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => formatCurrency(Number(v), currency)} contentStyle={{ borderRadius: "8px", fontSize: 12, border: "1px solid var(--border)" }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <p className="text-[10px] text-muted-foreground">Total</p>
                    <p className="text-sm font-bold">{formatCurrency(incomePieData.reduce((s, d) => s + d.value, 0), currency)}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2.5">
                {(() => {
                  const total = incomePieData.reduce((s, d) => s + d.value, 0);
                  return incomePieData.map((d, i) => {
                    const pct = total > 0 ? (d.value / total) * 100 : 0;
                    return (
                      <div key={d.name} className="flex items-center gap-3">
                        <div className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color || CHART_COLORS[i % CHART_COLORS.length] }} />
                        <span className="text-xs flex-1 truncate">{d.name}</span>
                        <span className="text-xs font-medium tabular-nums">{formatCurrency(d.value, currency)}</span>
                        <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden shrink-0">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: d.color || CHART_COLORS[i % CHART_COLORS.length] }} />
                        </div>
                        <span className="text-[10px] text-muted-foreground w-8 text-right tabular-nums">{pct.toFixed(0)}%</span>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}
        </div>}

        {/* Expense by category */}
        {sections.expense_by_category && <div ref={expensePieRef} className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">Expense by Category</h3>
            {expensePieData.length > 0 && (
              <Button
                data-download-hide
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs h-7 cursor-pointer"
                onClick={() => expensePieRef.current && downloadCardAsImage(expensePieRef.current, "expense_by_category.png")}
              >
                <Download size={13} /> Download
              </Button>
            )}
          </div>
          {expensePieData.length === 0 ? (
            <ChartEmptyState message="No expense data this month" />
          ) : (
            <div>
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <ResponsiveContainer width={160} height={160}>
                    <PieChart>
                      <Pie data={expensePieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={52} outerRadius={72} paddingAngle={3} strokeWidth={0}>
                        {expensePieData.map((d, i) => (
                          <Cell key={i} fill={d.color || CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => formatCurrency(Number(v), currency)} contentStyle={{ borderRadius: "8px", fontSize: 12, border: "1px solid var(--border)" }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <p className="text-[10px] text-muted-foreground">Total</p>
                    <p className="text-sm font-bold">{formatCurrency(expensePieData.reduce((s, d) => s + d.value, 0), currency)}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2.5">
                {(() => {
                  const total = expensePieData.reduce((s, d) => s + d.value, 0);
                  return expensePieData.map((d, i) => {
                    const pct = total > 0 ? (d.value / total) * 100 : 0;
                    return (
                      <div key={d.name} className="flex items-center gap-3">
                        <div className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color || CHART_COLORS[i % CHART_COLORS.length] }} />
                        <span className="text-xs flex-1 truncate">{d.name}</span>
                        <span className="text-xs font-medium tabular-nums">{formatCurrency(d.value, currency)}</span>
                        <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden shrink-0">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: d.color || CHART_COLORS[i % CHART_COLORS.length] }} />
                        </div>
                        <span className="text-[10px] text-muted-foreground w-8 text-right tabular-nums">{pct.toFixed(0)}%</span>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}
        </div>}
      </div>}

      {/* Recent transactions */}
      {sections.recent_transactions && <div className="rounded-xl border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold">Recent Transactions</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/transactions")}
          >
            View all
          </Button>
        </div>
        {(stats?.recent_transactions.length ?? 0) === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No transactions yet.
          </p>
        ) : (
          <div className="space-y-3">
            {stats?.recent_transactions.map((t) => (
              <div key={t.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`size-8 rounded-full flex items-center justify-center text-xs font-bold
                    ${t.type === "income" ? "bg-emerald-100 dark:bg-emerald-900 text-emerald-700" : "bg-rose-100 dark:bg-rose-900 text-rose-700"}`}
                  >
                    {t.type === "income" ? "+" : "−"}
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {t.category?.name ?? "Uncategorised"}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDate(t.date)}{t.time ? ` · ${formatTime(t.time)}` : ''}</p>
                  </div>
                </div>
                <span
                  className={`text-sm font-semibold ${t.type === "income" ? "text-emerald-600" : "text-rose-600"}`}
                >
                  {t.type === "income" ? "+" : "−"}
                  {formatCurrency(t.amount, currency)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>}

      <AddAccountDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreated={() => void load(selectedMonth, false)}
      />

      <FAB onCreated={() => void load(selectedMonth, false)} />
    </div>
  );
}

export default DashboardPage;
