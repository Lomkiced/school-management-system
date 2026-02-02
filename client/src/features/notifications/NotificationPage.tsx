// FILE: client/src/features/notifications/NotificationPage.tsx
import { Bell, CheckCheck, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Skeleton } from '../../components/ui/skeleton';
import api from '../../lib/axios';
import { cn } from '../../lib/utils';

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
}

export const NotificationPage = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchNotifications = async () => {
        try {
            setIsLoading(true);
            const res = await api.get('/notifications');
            setNotifications(res.data.data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load notifications');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const markAllRead = async () => {
        try {
            await api.patch('/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            toast.success('All marked as read');
        } catch (error) {
            toast.error('Failed to mark all as read');
        }
    };

    const deleteNotification = async (id: string) => {
        try {
            await api.delete(`/notifications/${id}`);
            setNotifications(prev => prev.filter(n => n.id !== id));
            toast.success('Notification deleted');
        } catch (error) {
            toast.error('Failed to delete');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Notifications</h1>
                <button
                    onClick={markAllRead}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                >
                    <CheckCheck size={16} />
                    Mark all as read
                </button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        All Notifications
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">
                            <Bell className="h-12 w-12 mx-auto mb-4 opacity-20" />
                            <p>No notifications found</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={cn(
                                        "flex items-start justify-between p-4 rounded-lg border transition-colors",
                                        notification.isRead ? "bg-white border-slate-100" : "bg-indigo-50/50 border-indigo-100"
                                    )}
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className={cn("font-medium", notification.isRead ? "text-slate-700" : "text-slate-900")}>
                                                {notification.title}
                                            </h4>
                                            {!notification.isRead && (
                                                <span className="w-2 h-2 rounded-full bg-indigo-600" />
                                            )}
                                        </div>
                                        <p className="text-sm text-slate-600">{notification.message}</p>
                                        <p className="text-xs text-slate-400 mt-2">
                                            {new Date(notification.createdAt).toLocaleString()}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => deleteNotification(notification.id)}
                                        className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default NotificationPage;
