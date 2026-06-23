import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Moon, Sun } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useThemeStore } from '@/store/themeStore';
import { getErrorMessage } from '@/lib/utils';

const registerSchema = z
  .object({
    name: z.string().min(1, 'Name is required').max(255, 'Name is too long'),
    mobile: z.string().regex(/^\d{10}$/, 'Enter a valid 10-digit mobile number'),
    email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    password_confirmation: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: 'Passwords do not match',
    path: ['password_confirmation'],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

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

function AppLogo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex size-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
        <svg viewBox="0 0 24 24" className="size-5 fill-white" aria-hidden="true">
          <path d="M21 18v1c0 1.1-.9 2-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14c1.1 0 2 .9 2 2v1h-9a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
        </svg>
      </div>
      <span className="text-lg font-semibold tracking-tight text-white">Cashlytics</span>
    </div>
  );
}

function SavingsIllustration() {
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
          .sv-glow {
            transform-box: fill-box; transform-origin: center;
            animation: svPulse 3s ease-in-out infinite;
          }
          @keyframes svPulse {
            0%,100% { opacity: .12; transform: scale(1); }
            50%      { opacity: .28; transform: scale(1.07); }
          }
          .sv-ring {
            stroke-dasharray: 502;
            stroke-dashoffset: 502;
            animation: svRing 1.4s ease-out .2s forwards;
          }
          @keyframes svRing { to { stroke-dashoffset: 126; } }
          .sv-inner-ring {
            stroke-dasharray: 376;
            stroke-dashoffset: 376;
            animation: svRing2 1.2s ease-out .4s forwards;
          }
          @keyframes svRing2 { to { stroke-dashoffset: 94; } }
          .sv-coin { transform-box: fill-box; transform-origin: center top; }
          .sv-c1 { animation: svDrop .6s cubic-bezier(.34,1.2,.64,1) .6s both; }
          .sv-c2 { animation: svDrop .6s cubic-bezier(.34,1.2,.64,1) .9s both; }
          .sv-c3 { animation: svDrop .6s cubic-bezier(.34,1.2,.64,1) 1.2s both; }
          .sv-c4 { animation: svDrop .6s cubic-bezier(.34,1.2,.64,1) 1.5s both; }
          @keyframes svDrop {
            from { transform: translateY(-40px); opacity: 0; }
            to   { transform: translateY(0);     opacity: 1; }
          }
          .sv-star1 { animation: svTwinkle 2.2s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
          .sv-star2 { animation: svTwinkle 2.2s ease-in-out .7s infinite; transform-box: fill-box; transform-origin: center; }
          .sv-star3 { animation: svTwinkle 2.2s ease-in-out 1.4s infinite; transform-box: fill-box; transform-origin: center; }
          @keyframes svTwinkle {
            0%,100% { opacity: .25; transform: scale(.75) rotate(0deg); }
            50%      { opacity: 1;  transform: scale(1.2) rotate(15deg); }
          }
          .sv-arrow {
            stroke-dasharray: 120;
            stroke-dashoffset: 120;
            animation: svArrow .9s ease-out 1.8s forwards;
          }
          @keyframes svArrow { to { stroke-dashoffset: 0; } }
          .sv-label { animation: svFade .6s ease-out 2.2s both; }
          @keyframes svFade {
            from { opacity: 0; transform: translateY(6px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          .sv-float { animation: svFloat 3.2s ease-in-out infinite; }
          .sv-float2 { animation: svFloat 3.2s ease-in-out 1.1s infinite; }
          @keyframes svFloat {
            0%,100% { transform: translateY(0); }
            50%      { transform: translateY(-10px); }
          }
        `}</style>
      </defs>

      {/* Ambient glow */}
      <circle className="sv-glow" cx="160" cy="148" r="115" fill="rgba(139,92,246,.4)" />

      {/* Outer progress ring (80% filled = 80% of 502 = 402, offset = 100) */}
      <circle
        className="sv-ring"
        cx="160" cy="150" r="80"
        stroke="rgba(255,255,255,.15)"
        strokeWidth="12"
        strokeLinecap="round"
        fill="none"
        transform="rotate(-90 160 150)"
      />
      <circle
        cx="160" cy="150" r="80"
        stroke="rgba(255,255,255,.08)"
        strokeWidth="12"
        fill="none"
      />

      {/* Inner progress ring (60%) */}
      <circle
        className="sv-inner-ring"
        cx="160" cy="150" r="60"
        stroke="rgba(251,191,36,.6)"
        strokeWidth="8"
        strokeLinecap="round"
        fill="none"
        transform="rotate(-90 160 150)"
      />
      <circle
        cx="160" cy="150" r="60"
        stroke="rgba(255,255,255,.05)"
        strokeWidth="8"
        fill="none"
      />

      {/* Centre label */}
      <text className="sv-label" x="160" y="143" textAnchor="middle" fontSize="13" fill="rgba(255,255,255,.6)" fontWeight="500">Saved</text>
      <text className="sv-label" x="160" y="163" textAnchor="middle" fontSize="22" fill="white" fontWeight="700">68%</text>

      {/* Falling coins */}
      <g className="sv-coin sv-c1">
        <circle cx="100" cy="56" r="14" fill="#d97706" />
        <circle cx="100" cy="52" r="14" fill="#fbbf24" />
        <text x="100" y="57" textAnchor="middle" fontSize="11" fill="white" fontWeight="700">₹</text>
      </g>
      <g className="sv-coin sv-c2">
        <circle cx="135" cy="44" r="12" fill="#d97706" />
        <circle cx="135" cy="40" r="12" fill="#fbbf24" />
        <text x="135" y="45" textAnchor="middle" fontSize="9" fill="white" fontWeight="700">₹</text>
      </g>
      <g className="sv-coin sv-c3">
        <circle cx="185" cy="48" r="14" fill="#d97706" />
        <circle cx="185" cy="44" r="14" fill="#fbbf24" />
        <text x="185" y="49" textAnchor="middle" fontSize="11" fill="white" fontWeight="700">₹</text>
      </g>
      <g className="sv-coin sv-c4">
        <circle cx="220" cy="60" r="11" fill="#d97706" />
        <circle cx="220" cy="56" r="11" fill="#fbbf24" />
        <text x="220" y="61" textAnchor="middle" fontSize="8" fill="white" fontWeight="700">₹</text>
      </g>

      {/* Upward arrow outside ring */}
      <g className="sv-float">
        <polyline
          className="sv-arrow"
          points="275,220 275,180 275,185 268,193 275,185 282,193"
          stroke="rgba(255,255,255,.8)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </g>

      {/* Sparkle stars */}
      <g className="sv-star1">
        <path d="M56 200 L58.5 207 L66 207 L60 212 L62.5 219 L56 214 L49.5 219 L52 212 L46 207 L53.5 207 Z" fill="rgba(255,255,255,.65)" />
      </g>
      <g className="sv-star2">
        <path d="M276 110 L278 116 L284 116 L279 120 L281 126 L276 122 L271 126 L273 120 L268 116 L274 116 Z" fill="rgba(251,191,36,.8)" />
      </g>
      <g className="sv-star3">
        <path d="M42 120 L43.5 125 L49 125 L44.5 128.5 L46 134 L42 130.5 L38 134 L39.5 128.5 L35 125 L40.5 125 Z" fill="rgba(255,255,255,.45)" />
      </g>

      {/* Floating small coin */}
      <g className="sv-float2">
        <circle cx="294" cy="180" r="14" fill="rgba(251,191,36,.7)" />
        <text x="294" y="185" textAnchor="middle" fontSize="11" fill="white" fontWeight="700">₹</text>
      </g>
    </svg>
  );
}

function RegisterPage() {
  const { register } = useAuth();
  const { theme, toggleTheme } = useThemeStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      mobile: '',
      email: '',
      password: '',
      password_confirmation: '',
    },
  });

  async function onSubmit(values: RegisterFormValues) {
    setFormError(null);
    setIsSubmitting(true);
    try {
      await register(values);
    } catch (error) {
      setFormError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleGoogleLogin() {
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/google/redirect`;
  }

  return (
    <div className="flex min-h-screen">
      {/* ── Left panel: illustration ── */}
      <div className="hidden lg:flex w-[45%] flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900 px-12 relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -top-24 -right-20 h-80 w-80 rounded-full bg-violet-600/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-purple-600/20 blur-3xl" />

        <div className="relative z-10 flex flex-col items-center gap-8 text-center">
          <AppLogo />

          <SavingsIllustration />

          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-white">Start your journey.</h2>
            <p className="max-w-xs text-sm leading-relaxed text-violet-200/70">
              Set goals, track progress, and build habits that lead to real financial freedom.
            </p>
          </div>

          {/* Feature list */}
          <ul className="space-y-2 text-left">
            {[
              'Track income & expenses in one place',
              'Visualise spending across categories',
              'Stay on top of your savings goals',
            ].map((item) => (
              <li key={item} className="flex items-center gap-2.5 text-sm text-violet-200/80">
                <svg viewBox="0 0 16 16" className="size-4 shrink-0 fill-violet-400" aria-hidden="true">
                  <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0z" />
                </svg>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── Right panel: form ── */}
      <div className="flex w-full flex-col items-center justify-center overflow-y-auto bg-background px-6 py-12 lg:w-[55%] relative">
        <button
          type="button"
          onClick={toggleTheme}
          className="absolute top-4 right-4 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
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
            <h1 className="text-2xl font-bold tracking-tight">Create an account</h1>
            <p className="text-sm text-muted-foreground">Start tracking your income and expenses</p>
          </div>

          {/* Google OAuth button */}
          <Button
            type="button"
            variant="outline"
            className="h-10 w-full gap-3 text-sm"
            onClick={handleGoogleLogin}
          >
            <GoogleIcon />
            Continue with Google
          </Button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-background px-3 text-xs uppercase tracking-widest text-muted-foreground">
                or continue with email
              </span>
            </div>
          </div>

          {/* Registration form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full name</FormLabel>
                    <FormControl>
                      <Input placeholder="" autoComplete="name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="mobile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mobile number</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        inputMode="numeric"
                        placeholder=""
                        autoComplete="tel"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                        autoComplete="new-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password_confirmation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm password</FormLabel>
                    <FormControl>
                      <PasswordInput
                        placeholder=""
                        autoComplete="new-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {formError && <p className="text-sm text-destructive">{formError}</p>}

              <Button type="submit" className="h-10 w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Creating account…' : 'Create account'}
              </Button>
            </form>
          </Form>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-foreground hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
