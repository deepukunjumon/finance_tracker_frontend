import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Bell, Check, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { deleteNotification, getNotifications, markAllRead } from '@/api/notifications';
import { formatDate, getErrorMessage } from '@/lib/utils';
import type { Notification, PaginatedResponse } from '@/types';

function NotificationsPage() {
  const [data, setData] = useState<PaginatedResponse<Notification> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      setData(await getNotifications());
    } catch (e) { toast.error(getErrorMessage(e)); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { void fetchNotifications(); }, []);

  const handleMarkAllRead = async () => {
    try {
      await markAllRead();
      await fetchNotifications();
      toast.success('All notifications marked as read.');
    } catch (e) { toast.error(getErrorMessage(e)); }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteNotification(id);
      setData((prev) => prev ? { ...prev, data: prev.data.filter((n) => n.id !== id) } : prev);
      toast.success('Notification deleted.');
    } catch (e) { toast.error(getErrorMessage(e)); }
  };

  const notifications = data?.data ?? [];
  const unreadCount   = notifications.filter((n) => !n.read_at).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-muted-foreground mt-0.5">{unreadCount} unread</p>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" className="gap-2" onClick={handleMarkAllRead}>
            <Check size={14} /> Mark all read
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />)}</div>
      ) : notifications.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-card p-14 text-center">
          <Bell className="mx-auto size-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">No notifications.</p>
        </div>
      ) : (
        <div className="rounded-xl border bg-card divide-y">
          {notifications.map((n) => (
            <div key={n.id} className={`flex items-start gap-4 px-5 py-4 group ${!n.read_at ? 'bg-muted/30' : ''}`}>
              <div className={`size-2 rounded-full mt-2 shrink-0 ${!n.read_at ? 'bg-primary' : 'bg-transparent'}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{n.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>
                <p className="text-xs text-muted-foreground/60 mt-1">{formatDate(n.created_at)}</p>
              </div>
              <button onClick={() => void handleDelete(n.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0 cursor-pointer">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default NotificationsPage;
