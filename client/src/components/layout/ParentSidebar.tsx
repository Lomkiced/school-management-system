import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import {
  CreditCard,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Settings,
  Users
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const sidebarItems = [
  { icon: LayoutDashboard, label: 'Overview', href: '/parent/dashboard' },
  { icon: Users, label: 'My Children', href: '/parent/children' },
  { icon: CreditCard, label: 'Fees & Payments', href: '/parent/fees' },
  { icon: MessageSquare, label: 'Messages', href: '/parent/messages' },
  { icon: Settings, label: 'Settings', href: '/parent/settings' },
];

export default function ParentSidebar() {
  const location = useLocation();
  const logout = useAuthStore((state) => state.logout);

  return (
    <div className="flex h-full w-64 flex-col bg-slate-900 text-white shadow-xl">
      <div className="flex h-16 items-center justify-center border-b border-slate-800">
        <h1 className="text-xl font-bold tracking-wider text-blue-400">PARENT PORTAL</h1>
      </div>
      
      <nav className="flex-1 space-y-2 p-4">
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;
          
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all hover:bg-slate-800",
                isActive ? "bg-blue-600 text-white shadow-md hover:bg-blue-700" : "text-slate-400"
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-800 p-4">
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-red-400 hover:bg-red-950/30 transition-colors"
        >
          <LogOut className="h-5 w-5" />
          Sign Out
        </button>
      </div>
    </div>
  );
}