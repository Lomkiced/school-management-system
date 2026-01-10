import {
  Banknote,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  School,
  Settings,
  Users
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../ui/button';

export const Sidebar = () => {
  const location = useLocation();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);

  const isActive = (path: string) => location.pathname.startsWith(path);

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Students', path: '/students', icon: GraduationCap },
    { label: 'Teachers', path: '/teachers', icon: Users },
    { label: 'Classes', path: '/classes', icon: School },
    { label: 'Finance', path: '/finance', icon: Banknote },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-100">
        <School className="h-6 w-6 text-indigo-600 mr-2" />
        <span className="font-bold text-lg text-slate-800 tracking-tight">Academia</span>
      </div>

      {/* Navigation */}
      <div className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Main Menu
        </div>
        {navItems.map((item) => (
          <Link key={item.path} to={item.path}>
            <Button
              variant={isActive(item.path) ? "secondary" : "ghost"}
              className={`w-full justify-start gap-3 mb-1 ${
                isActive(item.path) 
                  ? "bg-indigo-50 text-indigo-700 hover:bg-indigo-100" 
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <item.icon className={`h-4 w-4 ${isActive(item.path) ? "text-indigo-600" : "text-slate-500"}`} />
              {item.label}
            </Button>
          </Link>
        ))}
      </div>

      {/* Footer / User Profile */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
            {user?.firstName?.[0] || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-slate-500 truncate capitalize">
              {user?.role?.toLowerCase() || 'Admin'}
            </p>
          </div>
        </div>
        <Button 
          variant="outline" 
          onClick={() => { logout(); window.location.href = '/login'; }} 
          className="w-full justify-start gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-100"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
};