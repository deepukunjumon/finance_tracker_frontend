import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Wallet, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { completeOnboarding } from '@/api/accounts';
import { useAuthStore } from '@/store/authStore';
import { cn, getErrorMessage } from '@/lib/utils';

const CURRENCIES = [
  { code: 'INR', symbol: '₹',   name: 'Indian Rupee' },
  { code: 'USD', symbol: '$',   name: 'US Dollar' },
  { code: 'EUR', symbol: '€',   name: 'Euro' },
  { code: 'GBP', symbol: '£',   name: 'British Pound' },
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham' },
  { code: 'SGD', symbol: 'S$',  name: 'Singapore Dollar' },
  { code: 'AUD', symbol: 'A$',  name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$',  name: 'Canadian Dollar' },
  { code: 'JPY', symbol: '¥',   name: 'Japanese Yen' },
  { code: 'CHF', symbol: 'Fr',  name: 'Swiss Franc' },
  { code: 'CNY', symbol: '¥',   name: 'Chinese Yuan' },
  { code: 'MYR', symbol: 'RM',  name: 'Malaysian Ringgit' },
] as const;

const balanceSchema = z.object({
  cash_balance: z
    .string()
    .min(1, 'Balance is required')
    .refine((v) => !isNaN(Number(v)) && Number(v) >= 0, 'Enter a valid amount'),
});

type BalanceFormValues = z.infer<typeof balanceSchema>;

/* ── Step indicator ───────────────────────────────────────────── */
function StepDots({ current }: { current: 1 | 2 }) {
  return (
    <div className="flex items-center gap-1.5">
      {([1, 2] as const).map((n) => (
        <div
          key={n}
          className={cn(
            'rounded-full transition-all duration-300',
            n === current
              ? 'h-2 w-6 bg-foreground'
              : n < current
              ? 'h-2 w-2 bg-foreground/40'
              : 'h-2 w-2 bg-border',
          )}
        />
      ))}
      <span className="ml-2 text-xs text-muted-foreground">Step {current} of 2</span>
    </div>
  );
}

/* ── Main page ────────────────────────────────────────────────── */
function OnboardingPage() {
  const navigate   = useNavigate();
  const updateUser = useAuthStore((s) => s.updateUser);
  const user       = useAuthStore((s) => s.user);

  const [step, setStep]                     = useState<1 | 2>(1);
  const [selectedCurrency, setSelectedCurrency] = useState('INR');
  const [isSubmitting, setIsSubmitting]     = useState(false);

  const form = useForm<BalanceFormValues>({
    resolver: zodResolver(balanceSchema),
    defaultValues: { cash_balance: '' },
  });

  const currencyData = CURRENCIES.find((c) => c.code === selectedCurrency)!;

  async function onSubmit(values: BalanceFormValues) {
    setIsSubmitting(true);
    try {
      const updatedUser = await completeOnboarding({
        currency:     selectedCurrency,
        cash_balance: Number(values.cash_balance),
      });
      updateUser(updatedUser);
      toast.success('Setup complete! Welcome to Cashlytics.');
      navigate('/dashboard');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/20">
      {/* Top bar */}
      <header className="flex items-center justify-between border-b bg-background px-6 py-3.5">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-foreground/5">
            <svg viewBox="0 0 24 24" className="size-4 fill-foreground" aria-hidden="true">
              <path d="M21 18v1c0 1.1-.9 2-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14c1.1 0 2 .9 2 2v1h-9a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
            </svg>
          </div>
          <span className="text-sm font-semibold tracking-tight">Cashlytics</span>
        </div>
        {user?.name && (
          <span className="text-xs text-muted-foreground">
            Hi, {user.name.split(' ')[0]} 👋
          </span>
        )}
      </header>

      {/* Scrollable content */}
      <div className="flex flex-1 flex-col items-center justify-start px-4 py-10 sm:justify-center">
        <div className="w-full max-w-md">

          {/* ── STEP 1: Currency ── */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="space-y-3">
                <StepDots current={1} />
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">Choose your currency</h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    All balances and transactions will be shown in this currency.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {CURRENCIES.map((c) => {
                  const active = selectedCurrency === c.code;
                  return (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => setSelectedCurrency(c.code)}
                      className={cn(
                        'relative flex flex-col items-start gap-1.5 rounded-xl border p-3.5 text-left transition-all duration-150',
                        'outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        active
                          ? 'border-foreground bg-foreground shadow-sm'
                          : 'border-border bg-background hover:border-foreground/25 hover:bg-muted/60',
                      )}
                    >
                      {active && (
                        <CheckCircle2 className="absolute right-2.5 top-2.5 size-3.5 text-background/60" />
                      )}
                      <span className={cn('text-2xl font-bold leading-none', active ? 'text-background' : '')}>
                        {c.symbol}
                      </span>
                      <div>
                        <p className={cn('text-sm font-semibold leading-none', active ? 'text-background' : '')}>
                          {c.code}
                        </p>
                        <p className={cn('mt-0.5 text-xs leading-none', active ? 'text-background/60' : 'text-muted-foreground')}>
                          {c.name}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <Button className="h-11 w-full gap-2 text-sm" onClick={() => setStep(2)}>
                Continue
                <ArrowRight className="size-4" />
              </Button>
            </div>
          )}

          {/* ── STEP 2: Cash balance ── */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="space-y-3">
                <StepDots current={2} />
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">Set your cash balance</h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    How much cash do you have right now? You can always update this later.
                  </p>
                </div>
              </div>

              {/* Currency summary chip */}
              <div className="flex items-center justify-between rounded-lg border bg-background px-4 py-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-7 items-center justify-center rounded-md bg-muted text-sm font-bold">
                    {currencyData.symbol}
                  </div>
                  <div>
                    <p className="text-xs font-medium leading-none">{currencyData.code}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground leading-none">{currencyData.name}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
                >
                  Change
                </button>
              </div>

              {/* Balance card */}
              <div className="rounded-2xl border bg-background shadow-sm overflow-hidden">
                {/* Card header */}
                <div className="flex items-center gap-3 border-b bg-muted/30 px-5 py-4">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-50">
                    <Wallet className="size-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Cash</p>
                    <p className="text-xs text-muted-foreground">Default cash account</p>
                  </div>
                </div>

                {/* Amount input */}
                <div className="px-5 py-6">
                  <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Opening balance
                  </p>
                  <Form {...form}>
                    <form id="balance-form" onSubmit={form.handleSubmit(onSubmit)}>
                      <FormField
                        control={form.control}
                        name="cash_balance"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <div className="flex items-center gap-0 rounded-xl border border-input bg-muted/30 px-4 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 transition-all">
                                <span className="shrink-0 text-xl font-semibold text-muted-foreground pr-2 border-r border-border">
                                  {currencyData.symbol}
                                </span>
                                <input
                                  type="number"
                                  inputMode="decimal"
                                  min="0"
                                  step="0.01"
                                  placeholder="0.00"
                                  className="flex-1 bg-transparent py-4 pl-3 text-2xl font-bold tracking-tight outline-none placeholder:text-muted-foreground/40 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormMessage className="mt-1.5 text-xs" />
                          </FormItem>
                        )}
                      />
                    </form>
                  </Form>
                  <p className="mt-3 text-xs text-muted-foreground">
                    Enter 0 if you'd like to set this up later.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 w-full gap-2"
                  onClick={() => setStep(1)}
                >
                  <ArrowLeft className="size-4" />
                  Back
                </Button>
                <Button
                  type="submit"
                  form="balance-form"
                  className="h-11 w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Setting up…' : 'Complete setup'}
                </Button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default OnboardingPage;
