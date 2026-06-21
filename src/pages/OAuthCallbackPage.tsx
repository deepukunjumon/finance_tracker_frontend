import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { useAuthStore } from '@/store/authStore';

function OAuthCallbackPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  useEffect(() => {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);

    const error = params.get('error');
    if (error) {
      toast.error(error);
      navigate('/login', { replace: true });
      return;
    }

    const token                = params.get('token');
    const id                   = params.get('id');
    const name                 = params.get('name');
    const email                = params.get('email');
    const currency             = params.get('currency') ?? 'INR';
    const onboarding_completed = params.get('onboarding_completed') === '1';
    const role                 = (params.get('role') as 'user' | 'superadmin') ?? 'user';

    if (!token || !id || !name || !email) {
      toast.error('Authentication failed. Please try again.');
      navigate('/login', { replace: true });
      return;
    }

    window.history.replaceState(null, '', window.location.pathname);

    setAuth({ user: { id, name, email, mobile: null, currency, onboarding_completed, role, profile_picture: null }, token });
    toast.success('Logged in successfully.');
    navigate(onboarding_completed ? '/dashboard' : '/onboarding', { replace: true });
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <svg className="size-6 animate-spin text-muted-foreground" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <p className="text-sm text-muted-foreground">Completing sign-in…</p>
      </div>
    </div>
  );
}

export default OAuthCallbackPage;
