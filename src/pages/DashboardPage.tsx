import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
  Download,
  Folder,
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
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Button } from "@/components/ui/button";
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
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-3 sm:p-5 flex items-center gap-2.5 sm:gap-4">
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

function inlineStyles(source: SVGElement, target: SVGElement) {
  const computed = window.getComputedStyle(source);
  const important = ['fill', 'stroke', 'stroke-width', 'font-size', 'font-family', 'font-weight', 'text-anchor', 'dominant-baseline', 'opacity', 'visibility', 'display'];
  important.forEach((prop) => {
    const val = computed.getPropertyValue(prop);
    if (val) (target as unknown as HTMLElement).style.setProperty(prop, val);
  });
  const srcChildren = source.children;
  const tgtChildren = target.children;
  for (let i = 0; i < srcChildren.length; i++) {
    if (srcChildren[i] instanceof SVGElement && tgtChildren[i] instanceof SVGElement) {
      inlineStyles(srcChildren[i] as SVGElement, tgtChildren[i] as SVGElement);
    }
  }
}

function downloadChartAsImage(container: HTMLElement, filename: string) {
  const svg = container.querySelector("svg");
  if (!svg) return;

  const clone = svg.cloneNode(true) as SVGSVGElement;
  const { width, height } = svg.getBoundingClientRect();
  clone.setAttribute("width", String(width));
  clone.setAttribute("height", String(height));
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");

  inlineStyles(svg as unknown as SVGElement, clone);

  // Remove any Recharts tooltip/hover layers
  clone.querySelectorAll(".recharts-tooltip-wrapper").forEach((el) => el.remove());

  const serializer = new XMLSerializer();
  const svgStr = serializer.serializeToString(clone);
  const svgBlob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);

  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement("canvas");
    const scale = 2;
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.scale(scale, scale);
    ctx.drawImage(img, 0, 0, width, height);
    URL.revokeObjectURL(url);

    const a = document.createElement("a");
    a.download = filename;
    a.href = canvas.toDataURL("image/png");
    a.click();
  };
  img.src = url;
}

function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("");
  const currency = user?.currency ?? "INR";

  const expensePieRef = useRef<HTMLDivElement>(null);
  const categoryPieRef = useRef<HTMLDivElement>(null);

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
        all_by_category:      monthStats.all_by_category,
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
    })) ?? [];

  const allCategoryPieData = (() => {
    if (!stats?.all_by_category) return [];
    const map: Record<string, { name: string; value: number }> = {};
    stats.all_by_category.forEach((entry) => {
      const name = entry.category?.name ?? "Uncategorised";
      if (!map[name]) map[name] = { name, value: 0 };
      map[name].value += Number(entry.total);
    });
    return Object.values(map).sort((a, b) => b.value - a.value);
  })();

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
        />
        <StatCard
          label="Monthly Expense"
          value={formatCurrency(stats?.monthly_expense ?? 0, currency)}
          icon={<ArrowUpRight size={18} className="text-rose-600" />}
          color="bg-rose-50 dark:bg-rose-950"
        />
      </div>

      {/* Accounts */}
      <div>
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
      </div>

      {/* Month picker shared across charts */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Charts & Insights</h2>
        <MonthPicker
          value={selectedMonth}
          onChange={handleMonthChange}
          placeholder="This month"
          clearable
          disableFuture
          className="h-8 w-40 text-xs"
        />
      </div>

      {/* Charts row */}
      <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 transition-opacity ${chartLoading ? 'opacity-50 pointer-events-none' : ''}`}>
        {/* Income vs Expense trend */}
        <div className="rounded-xl border bg-card p-5">
          <h3 className="text-sm font-semibold mb-4">Income vs Expense</h3>
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
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Income" fill="#22c55e" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Expense" fill="#ef4444" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Expense by category — donut */}
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">Expense by Category</h3>
            {expensePieData.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs h-7 cursor-pointer"
                onClick={() => expensePieRef.current && downloadChartAsImage(expensePieRef.current, "expense_by_category.png")}
              >
                <Download size={13} /> Download
              </Button>
            )}
          </div>
          {expensePieData.length === 0 ? (
            <ChartEmptyState message="No expense data this month" />
          ) : (
            <div ref={expensePieRef}>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={expensePieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                  >
                    {expensePieData.map((_, i) => (
                      <Cell
                        key={i}
                        fill={CHART_COLORS[i % CHART_COLORS.length]}
                        stroke="none"
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: number) => formatCurrency(v, currency)}
                    contentStyle={{ borderRadius: "8px", fontSize: 12 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* All transactions by category pie chart */}
      <div className={`rounded-xl border bg-card p-5 transition-opacity ${chartLoading ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold">All Transactions by Category</h3>
          {allCategoryPieData.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs h-7 cursor-pointer"
              onClick={() => categoryPieRef.current && downloadChartAsImage(categoryPieRef.current, "transactions_by_category.png")}
            >
              <Download size={13} /> Download
            </Button>
          )}
        </div>
        {allCategoryPieData.length === 0 ? (
          <ChartEmptyState message="No transaction data this month" />
        ) : (
          <div ref={categoryPieRef}>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={allCategoryPieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  paddingAngle={2}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={{ strokeWidth: 1 }}
                >
                  {allCategoryPieData.map((_, i) => (
                    <Cell
                      key={i}
                      fill={CHART_COLORS[i % CHART_COLORS.length]}
                      stroke="none"
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: number) => formatCurrency(v, currency)}
                  contentStyle={{ borderRadius: "8px", fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Recent transactions */}
      <div className="rounded-xl border bg-card p-5">
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
      </div>

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
