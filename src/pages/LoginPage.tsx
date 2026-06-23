import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { getErrorMessage } from '@/lib/utils';
import { Shield } from 'lucide-react';
import { getPublicSettings } from '@/api/settings';
import { PasswordInput } from '@/components/ui/password-input';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4 shrink-0" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function AppLogo({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const iconSize = size === 'sm' ? 'size-8' : 'size-10';
  const svgSize = size === 'sm' ? 'size-4' : 'size-5';
  const textSize = size === 'sm' ? 'text-base' : 'text-lg';

  return (
    <div className="flex items-center gap-2.5">
      <div className={`flex ${iconSize} items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm border border-white/20`}>
        <svg viewBox="0 0 24 24" className={`${svgSize} fill-white`} aria-hidden="true">
          <path d="M21 18v1c0 1.1-.9 2-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14c1.1 0 2 .9 2 2v1h-9a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
        </svg>
      </div>
      <span className={`text-white font-semibold ${textSize} tracking-tight`}>Cashlytics</span>
    </div>
  );
}

function FinanceIllustration() {
  return (
    <svg
      viewBox="0 0 320 280"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full max-w-xs"
      aria-hidden="true"
    >
      <defs>
        <style>{`
          .ft-bar { transform-box: fill-box; transform-origin: bottom; }
          .ft-b1 { animation: ftGrow .7s cubic-bezier(.34,1.56,.64,1) .1s both; }
          .ft-b2 { animation: ftGrow .7s cubic-bezier(.34,1.56,.64,1) .25s both; }
          .ft-b3 { animation: ftGrow .7s cubic-bezier(.34,1.56,.64,1) .4s both; }
          .ft-b4 { animation: ftGrow .7s cubic-bezier(.34,1.56,.64,1) .55s both; }
          .ft-b5 { animation: ftGrow .7s cubic-bezier(.34,1.56,.64,1) .7s both; }
          @keyframes ftGrow {
            from { transform: scaleY(0); }
            to   { transform: scaleY(1); }
          }
          .ft-line {
            stroke-dasharray: 380;
            stroke-dashoffset: 380;
            animation: ftDraw 1.2s ease-out .9s forwards;
          }
          @keyframes ftDraw { to { stroke-dashoffset: 0; } }
          .ft-dot {
            transform-box: fill-box;
            transform-origin: center;
            animation: ftPop .35s cubic-bezier(.34,1.56,.64,1) 2.1s both;
          }
          @keyframes ftPop {
            from { transform: scale(0); opacity: 0; }
            to   { transform: scale(1); opacity: 1; }
          }
          .ft-c1 { animation: ftFloat 3s ease-in-out infinite; }
          .ft-c2 { animation: ftFloat 3s ease-in-out .9s infinite; }
          .ft-c3 { animation: ftFloat 3s ease-in-out 1.8s infinite; }
          @keyframes ftFloat {
            0%,100% { transform: translateY(0); }
            50%     { transform: translateY(-9px); }
          }
          .ft-card { animation: ftFade .6s ease-out both; }
          @keyframes ftFade {
            from { opacity: 0; transform: translateY(10px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          .ft-glow {
            transform-box: fill-box;
            transform-origin: center;
            animation: ftPulse 3s ease-in-out infinite;
          }
          @keyframes ftPulse {
            0%,100% { opacity: .12; transform: scale(1); }
            50%     { opacity: .25; transform: scale(1.06); }
          }
        `}</style>
      </defs>

      {/* Ambient glow */}
      <circle className="ft-glow" cx="160" cy="145" r="115" fill="rgba(99,102,241,.35)" />

      {/* Dashboard card */}
      <rect className="ft-card" x="28" y="44" width="264" height="196" rx="14" fill="rgba(255,255,255,.07)" stroke="rgba(255,255,255,.13)" strokeWidth="1" />
      {/* Card topbar */}
      <rect className="ft-card" x="28" y="44" width="264" height="34" rx="14" fill="rgba(255,255,255,.1)" />
      <rect x="28" y="62" width="264" height="16" fill="rgba(255,255,255,.1)" />
      <circle className="ft-card" cx="50" cy="61" r="7" fill="rgba(255,255,255,.35)" />
      <circle className="ft-card" cx="70" cy="61" r="7" fill="rgba(255,255,255,.18)" />
      <rect className="ft-card" x="88" y="55" width="70" height="10" rx="5" fill="rgba(255,255,255,.15)" />

      {/* Baseline */}
      <line x1="52" y1="216" x2="268" y2="216" stroke="rgba(255,255,255,.22)" strokeWidth="1.5" strokeLinecap="round" />

      {/* Grid */}
      <line x1="52" y1="190" x2="268" y2="190" stroke="rgba(255,255,255,.07)" strokeWidth="1" strokeDasharray="4 4" />
      <line x1="52" y1="165" x2="268" y2="165" stroke="rgba(255,255,255,.07)" strokeWidth="1" strokeDasharray="4 4" />
      <line x1="52" y1="140" x2="268" y2="140" stroke="rgba(255,255,255,.07)" strokeWidth="1" strokeDasharray="4 4" />

      {/* Bars */}
      <rect className="ft-bar ft-b1" x="60"  y="188" width="26" height="28" rx="4" fill="rgba(255,255,255,.22)" />
      <rect className="ft-bar ft-b2" x="103" y="169" width="26" height="47" rx="4" fill="rgba(255,255,255,.33)" />
      <rect className="ft-bar ft-b3" x="146" y="150" width="26" height="66" rx="4" fill="rgba(255,255,255,.44)" />
      <rect className="ft-bar ft-b4" x="189" y="128" width="26" height="88" rx="4" fill="rgba(255,255,255,.58)" />
      <rect className="ft-bar ft-b5" x="232" y="100" width="26" height="116" rx="4" fill="rgba(255,255,255,.88)" />

      {/* Trend line */}
      <polyline
        className="ft-line"
        points="73,185 116,166 159,147 202,125 245,97"
        stroke="#fbbf24"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Trend dot + halo */}
      <circle className="ft-dot" cx="245" cy="97" r="11" fill="rgba(251,191,36,.28)" />
      <circle className="ft-dot" cx="245" cy="97" r="5.5" fill="#fbbf24" />

      {/* Floating coins */}
      <g className="ft-c1">
        <circle cx="296" cy="82"  r="19" fill="rgba(251,191,36,.9)" />
        <text x="296" y="89" textAnchor="middle" fontSize="15" fill="white" fontWeight="700">₹</text>
      </g>
      <g className="ft-c2">
        <circle cx="24"  cy="122" r="13" fill="rgba(251,191,36,.65)" />
        <text x="24"  y="127" textAnchor="middle" fontSize="10" fill="white" fontWeight="700">₹</text>
      </g>
      <g className="ft-c3">
        <circle cx="302" cy="192" r="10" fill="rgba(251,191,36,.5)" />
        <text x="302" y="196" textAnchor="middle" fontSize="8"  fill="white" fontWeight="700">₹</text>
      </g>
    </svg>
  );
}

function LoginPage() {
  const { login } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [ssoEnabled,  setSsoEnabled]  = useState(false);
  const [ssoName,     setSsoName]     = useState('SSO');

  useEffect(() => {
    void getPublicSettings().then((s) => {
      setSsoEnabled(s.sso_enabled ?? false);
      setSsoName(s.sso_provider_name || 'SSO');
    }).catch(() => {});
  }, []);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  async function onSubmit(values: LoginFormValues) {
    setFormError(null);
    setIsSubmitting(true);
    try {
      await login(values);
    } catch (error) {
      setFormError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleGoogleLogin() {
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/google/redirect`;
  }

  function handleSsoLogin() {
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/sso/redirect`;
  }

  return (
    <div className="flex min-h-screen">
      {/* ── Left panel: illustration ── */}
      <div className="hidden lg:flex w-[45%] flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-12 relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full bg-indigo-600/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-violet-600/20 blur-3xl" />

        <div className="relative z-10 flex flex-col items-center gap-8 text-center">
          <AppLogo />

          <FinanceIllustration />

          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-white">Every rupee tracked.</h2>
            <p className="max-w-xs text-sm leading-relaxed text-indigo-200/70">
              Understand your spending, grow your savings, and take control of your financial future.
            </p>
          </div>

          {/* Quick stats */}
          <div className="flex items-center gap-8">
            <div className="text-center">
              <div className="text-xl font-bold text-white">10k+</div>
              <div className="text-xs text-indigo-300/60">Users</div>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div className="text-center">
              <div className="text-xl font-bold text-white">₹2Cr+</div>
              <div className="text-xs text-indigo-300/60">Tracked</div>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div className="text-center">
              <div className="text-xl font-bold text-white">4.9★</div>
              <div className="text-xs text-indigo-300/60">Rating</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right panel: form ── */}
      <div className="flex w-full flex-col items-center justify-center overflow-y-auto bg-background px-6 py-12 lg:w-[55%]">
        {/* Mobile-only logo */}
        <div className="mb-8 flex items-center gap-3 lg:hidden">
          <div className="flex size-12 items-center justify-center rounded-xl bg-foreground/5">
            <svg viewBox="0 0 24 24" className="size-6 fill-foreground" aria-hidden="true">
              <path d="M21 18v1c0 1.1-.9 2-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14c1.1 0 2 .9 2 2v1h-9a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight">Cashlytics</span>
        </div>

        <div className="w-full max-w-sm space-y-6">
          {/* Heading */}
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
            <p className="text-sm text-muted-foreground">Sign in to continue to your dashboard</p>
          </div>

          {/* Email / password form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="" autoComplete="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <PasswordInput
                        placeholder=""
                        autoComplete="current-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {formError && <p className="text-sm text-destructive">{formError}</p>}

              <Button type="submit" className="h-10 w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>
          </Form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-background px-3 text-xs uppercase tracking-widest text-muted-foreground">
                or continue with
              </span>
            </div>
          </div>

          {/* OAuth buttons */}
          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              className="h-10 w-full gap-3 text-sm"
              onClick={handleGoogleLogin}
            >
              <GoogleIcon />
              Continue with Google
            </Button>

            {ssoEnabled && (
              <Button
                type="button"
                variant="outline"
                className="h-10 w-full gap-3 text-sm"
                onClick={handleSsoLogin}
              >
                <Shield className="size-4 text-amber-500" />
                Continue with {ssoName}
              </Button>
            )}
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-foreground hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
