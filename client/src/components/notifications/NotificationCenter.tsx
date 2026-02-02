// FILE: client/src/components/notifications/NotificationCenter.tsx
// 2026 Standard: Real-time notification center with bell icon dropdown

import { Bell, Check, CheckCheck, ExternalLink, Trash2, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/axios';
import { socketService } from '../../lib/socket';
import { cn } from '../../lib/utils';

// ================= TYPES =================

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    link?: string;
    isRead: boolean;
    createdAt: string;
}

interface NotificationCenterProps {
    className?: string;
}

// ================= NOTIFICATION ICONS =================

const getNotificationIcon = (type: string): { icon: string; color: string } => {
    const icons: Record<string, { icon: string; color: string }> = {
        ATTENDANCE_ABSENT: { icon: '⚠️', color: 'text-red-500' },
        ATTENDANCE_LATE: { icon: '⏰', color: 'text-amber-500' },
        GRADE_POSTED: { icon: '📝', color: 'text-blue-500' },
        INVOICE_GENERATED: { icon: '📄', color: 'text-indigo-500' },
        INVOICE_OVERDUE: { icon: '🔔', color: 'text-red-500' },
        PORTAL_BLOCKED: { icon: '🔒', color: 'text-red-600' },
        ASSIGNMENT_DUE: { icon: '📚', color: 'text-orange-500' },
        QUIZ_RESULT: { icon: '🎯', color: 'text-emerald-500' },
        SYSTEM_ALERT: { icon: '💡', color: 'text-purple-500' },
    };
    return icons[type] || { icon: '🔔', color: 'text-slate-500' };
};

// ================= TIME FORMATTING =================

const formatTimeAgo = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
};

// ================= COMPONENT =================

export const NotificationCenter = ({ className }: NotificationCenterProps) => {
    const navigate = useNavigate();
    const dropdownRef = useRef<HTMLDivElement>(null);

    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [hasNewNotification, setHasNewNotification] = useState(false);

    // Fetch notifications
    const fetchNotifications = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await api.get('/notifications', {
                params: { limit: 10 }
            });
            setNotifications(response.data.data || []);
            setUnreadCount(response.data.unreadCount || 0);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Fetch unread count only
    const fetchUnreadCount = useCallback(async () => {
        try {
            const response = await api.get('/notifications/unread-count');
            setUnreadCount(response.data.count || 0);
        } catch (error) {
            console.error('Failed to fetch unread count:', error);
        }
    }, []);

    // Initial fetch
    useEffect(() => {
        fetchUnreadCount();
    }, [fetchUnreadCount]);

    // Fetch full list when dropdown opens
    useEffect(() => {
        if (isOpen) {
            fetchNotifications();
        }
    }, [isOpen, fetchNotifications]);

    // Socket.IO real-time notifications
    useEffect(() => {
        const socket = socketService.connect();

        socket?.on('notification:new', (notification: any) => {
            setNotifications(prev => [notification, ...prev.slice(0, 9)]);
            setUnreadCount(prev => prev + 1);
            setHasNewNotification(true);

            // Reset animation after 2 seconds
            setTimeout(() => setHasNewNotification(false), 2000);
        });

        return () => {
            socket?.off('notification:new');
        };
    }, []);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Mark single notification as read
    const markAsRead = async (id: string) => {
        try {
            await api.patch(`/notifications/${id}/read`);
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, isRead: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    // Mark all as read
    const markAllAsRead = async () => {
        try {
            await api.patch('/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    // Delete notification
    const deleteNotification = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await api.delete(`/notifications/${id}`);
            setNotifications(prev => prev.filter(n => n.id !== id));
        } catch (error) {
            console.error('Failed to delete notification:', error);
        }
    };

    // Handle notification click
    const handleNotificationClick = (notification: Notification) => {
        if (!notification.isRead) {
            markAsRead(notification.id);
        }
        if (notification.link) {
            navigate(notification.link);
            setIsOpen(false);
        }
    };

    return (
        <div ref={dropdownRef} className={cn("relative", className)}>
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "relative p-2 rounded-xl transition-all duration-300 hover:bg-slate-100",
                    isOpen && "bg-slate-100",
                    hasNewNotification && "animate-wiggle"
                )}
                aria-label="Notifications"
            >
                <Bell
                    size={22}
                    className={cn(
                        "transition-colors duration-300",
                        unreadCount > 0 ? "text-indigo-600" : "text-slate-500"
                    )}
                />

                {/* Unread Badge */}
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full animate-in zoom-in duration-200">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}

                {/* New notification pulse */}
                {hasNewNotification && (
                    <span className="absolute inset-0 rounded-xl bg-indigo-500/20 animate-ping" />
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200/50 overflow-hidden z-50 animate-in slide-in-from-top-2 duration-200">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                        <div className="flex items-center gap-2">
                            <Bell size={18} className="text-indigo-600" />
                            <h3 className="font-semibold text-slate-800">Notifications</h3>
                            {unreadCount > 0 && (
                                <span className="px-2 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-600 rounded-full">
                                    {unreadCount} new
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-1">
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                    title="Mark all as read"
                                >
                                    <CheckCheck size={16} />
                                </button>
                            )}
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Notification List */}
                    <div className="max-h-[400px] overflow-y-auto">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                                <Bell size={40} className="mb-3 opacity-50" />
                                <p className="text-sm font-medium">No notifications yet</p>
                                <p className="text-xs">We'll notify you when something happens</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {notifications.map((notification) => {
                                    const { icon, color } = getNotificationIcon(notification.type);

                                    return (
                                        <div
                                            key={notification.id}
                                            onClick={() => handleNotificationClick(notification)}
                                            className={cn(
                                                "group flex gap-3 px-4 py-3 cursor-pointer transition-all duration-200 hover:bg-slate-50",
                                                !notification.isRead && "bg-indigo-50/50"
                                            )}
                                        >
                                            {/* Icon */}
                                            <div className={cn(
                                                "flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-lg",
                                                notification.isRead ? "bg-slate-100" : "bg-white shadow-sm"
                                            )}>
                                                {icon}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <p className={cn(
                                                        "text-sm line-clamp-1",
                                                        notification.isRead ? "text-slate-600" : "text-slate-900 font-medium"
                                                    )}>
                                                        {notification.title}
                                                    </p>
                                                    <span className="flex-shrink-0 text-[10px] text-slate-400">
                                                        {formatTimeAgo(notification.createdAt)}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">
                                                    {notification.message}
                                                </p>

                                                {/* Actions */}
                                                <div className="flex items-center gap-2 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {notification.link && (
                                                        <span className="inline-flex items-center gap-1 text-[10px] text-indigo-600 font-medium">
                                                            <ExternalLink size={10} />
                                                            View
                                                        </span>
                                                    )}
                                                    {!notification.isRead && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                markAsRead(notification.id);
                                                            }}
                                                            className="inline-flex items-center gap-1 text-[10px] text-slate-400 hover:text-emerald-600"
                                                        >
                                                            <Check size={10} />
                                                            Mark read
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={(e) => deleteNotification(notification.id, e)}
                                                        className="inline-flex items-center gap-1 text-[10px] text-slate-400 hover:text-red-500"
                                                    >
                                                        <Trash2 size={10} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Unread indicator */}
                                            {!notification.isRead && (
                                                <div className="flex-shrink-0 w-2 h-2 rounded-full bg-indigo-500 mt-2" />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50">
                            <button
                                onClick={() => {
                                    navigate('/notifications');
                                    setIsOpen(false);
                                }}
                                className="w-full text-center text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                            >
                                View all notifications
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationCenter;
