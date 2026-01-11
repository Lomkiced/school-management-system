import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import {
  BookOpen,
  CreditCard,
  FileBarChart,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  School,
  Settings,
  Users
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const adminItems = [
  { 
    icon: LayoutDashboard, 
    label: 'Dashboard', 
    href: '/dashboard' 
  },
  { 
    icon: GraduationCap, 
    label: 'Students', 
    href: '/dashboard/students' // Note: You might need to adjust routes later
  },
  { 
    icon: Users, 
    label: 'Teachers', 
    href: '/dashboard/teachers' 
  },
  { 
    icon: School, 
    label: 'Classes', 
    href: '/dashboard/classes' 
  },
  { 
    icon: BookOpen, 
    label: 'Academics', 
    href: '/dashboard/academics' 
  },
  { 
    icon: CreditCard, 
    label: 'Finance', 
    href: '/dashboard/finance' 
  },
  { 
    icon: FileBarChart, 
    label: 'Reports', 
    href: '/dashboard/reports' 
  },
  { 
    icon: Settings, 
    label: 'Settings', 
    href: '/dashboard/settings' 
  },
];

export default function Sidebar() {
  const location = useLocation();
  const logout = useAuthStore((state) => state.logout);

  return (
    <div className="flex h-full w-64 flex-col bg-slate-900 text-white shadow-xl">
      {/* HEADER */}
      <div className="flex h-16 items-center justify-center border-b border-slate-800 px-6">
        <div className="flex items-center gap-2 font-bold tracking-wider text-white">
          <School className="h-6 w-6 text-blue-500" />
          <span>ADMIN PORTAL</span>
        </div>
      </div>
      
      {/* NAVIGATION */}
      <nav className="flex-1 space-y-1 p-4">
        {adminItems.map((item) => {
          const Icon = item.icon;
          // Check if current path starts with the item href (for active state)
          const isActive = location.pathname === item.href || 
                          (item.href !== '/dashboard' && location.pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.href}
              to={item.href} // <--- THE CRITICAL FIX: Uses React Router
              className={cn(
                "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200",
                isActive 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20 translate-x-1" 
                  : "text-slate-400 hover:bg-slate-800 hover:text-white hover:translate-x-1"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive ? "text-white" : "text-slate-400")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* FOOTER */}
      <div className="border-t border-slate-800 p-4">
        <button
          onClick={logout}
          className="group flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-red-400 hover:bg-red-950/30 transition-all"
        >
          <LogOut className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
          Sign Out
        </button>
      </div>
    </div>
  );
}