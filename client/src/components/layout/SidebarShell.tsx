// FILE: client/src/components/layout/SidebarShell.tsx
import { BookOpen, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../store/authStore';

interface SidebarShellProps {
  links: {
    href: string;
    label: string;
    icon: any;
  }[];
}

export const SidebarShell = ({ links }: SidebarShellProps) => {
  const { user, logout } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* MOBILE TRIGGER */}
      <div className="lg:hidden fixed top-0 left-0 z-50 w-full bg-white border-b border-slate-200 px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 text-indigo-600 font-bold text-lg">
          <BookOpen size={24} />
          <span>SchoolAdmin</span>
        </div>
        <button onClick={() => setIsOpen(!isOpen)} className="p-2 text-slate-600">
          {isOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* OVERLAY (Mobile) */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* SIDEBAR CONTAINER */}
      <aside className={cn(
        "fixed top-0 left-0 z-50 h-screen w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 pt-16 lg:pt-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        
        {/* BRANDING (Desktop) */}
        <div className="hidden lg:flex h-16 items-center border-b border-slate-200 px-6 shrink-0">
          <div className="flex items-center gap-2 text-indigo-600">
            <BookOpen className="h-6 w-6" />
            <span className="text-xl font-bold tracking-tight text-slate-900">
              School<span className="text-indigo-600">Admin</span>
            </span>
          </div>
        </div>
        
        {/* NAVIGATION LINKS */}
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <div className="mb-2 px-3 text-xs font-semibold uppercase text-slate-400 tracking-wider">
            Menu
          </div>
          <nav className="space-y-1">
            {links.map((link) => (
              <NavLink
                key={link.href}
                to={link.href}
                onClick={() => setIsOpen(false)} // Close on click (mobile)
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-200"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )
                }
              >
                <link.icon size={18} />
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* USER PROFILE FOOTER */}
        <div className="border-t border-slate-200 p-4 bg-slate-50/50">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="h-9 w-9 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
              {/* FIX: Safe access to initials with fallback */}
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="truncate text-sm font-medium text-slate-900">
                {user?.name || 'Guest User'}
              </p>
              <p className="truncate text-xs text-slate-500 capitalize">
                {user?.role?.toLowerCase() || 'Viewer'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              logout();
              setIsOpen(false);
            }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 hover:border-red-200 border border-transparent transition-all"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
};