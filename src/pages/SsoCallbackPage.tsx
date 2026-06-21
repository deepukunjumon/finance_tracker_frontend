import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

export default function SsoCallbackPage() {
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);

    const token = params.get('token');
    const error = params.get('error');

    if (error) {
      toast.error(error || 'SSO login failed.');
      navigate('/login');
      return;
    }

    if (!token) {
      toast.error('No token received from SSO provider.');
      navigate('/login');
      return;
    }

    window.history.replaceState(null, '', window.location.pathname);

    import('@/api/axios').then(({ api }) => {
      api.get('/profile', { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => {
          const user = res.data?.data ?? res.data;
          setAuth({ user, token });
          navigate(user.onboarding_completed ? '/dashboard' : '/onboarding');
        })
        .catch(() => {
          toast.error('Could not fetch user profile.');
          navigate('/login');
        });
    });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-muted-foreground text-sm">Completing sign-in...</p>
      </div>
    </div>
  );
}
