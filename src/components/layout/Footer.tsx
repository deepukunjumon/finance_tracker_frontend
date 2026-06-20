import { useEffect, useState } from 'react';
import { getPublicSettings } from '@/api/settings';

export function Footer() {
  const [version, setVersion] = useState('');

  useEffect(() => {
    void getPublicSettings().then((s) => {
      setVersion(s.app_version ?? '');
    }).catch(() => {});
  }, []);

  return (
    <footer className="text-muted-foreground/60 text-[10px] text-center py-3 shrink-0">
      &copy; {new Date().getFullYear()} Finance Tracker{version && ` · v${version}`}
    </footer>
  );
}
