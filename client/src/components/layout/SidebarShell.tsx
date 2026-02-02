// FILE: client/src/components/layout/SidebarShell.tsx
// 2026 Standard: Interactive, playful sidebar with micro-animations

import { BookOpen, LogOut, Menu, Sparkles, X } from 'lucide-react';
import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../store/authStore';
import { NotificationCenter } from '../notifications/NotificationCenter';
import { ModeToggle } from '../ui/ModeToggle';

interface SidebarShellProps {
  links: {
    href: string;
    label: string;
    icon: any;
  }[];
}

export const SidebarShell = ({ links }: SidebarShellProps) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Logout failed", error);
      window.location.href = '/login';
    }
  };

  const userInitials = user?.name ? user.name.charAt(0).toUpperCase() : 'U';
  const userName = user?.name || 'Guest User';
  const userRole = user?.role?.toLowerCase() || 'visitor';

  // Role-based accent colors
  const accentColors: Record<string, { bg: string; text: string; ring: string; gradient: string }> = {
    admin: { bg: 'bg-indigo-600', text: 'text-indigo-600', ring: 'ring-indigo-200', gradient: 'from-indigo-500 to-purple-600' },
    super_admin: { bg: 'bg-purple-600', text: 'text-purple-600', ring: 'ring-purple-200', gradient: 'from-purple-500 to-pink-600' },
    teacher: { bg: 'bg-emerald-600', text: 'text-emerald-600', ring: 'ring-emerald-200', gradient: 'from-emerald-500 to-teal-600' },
    student: { bg: 'bg-blue-600', text: 'text-blue-600', ring: 'ring-blue-200', gradient: 'from-blue-500 to-cyan-600' },
    parent: { bg: 'bg-amber-600', text: 'text-amber-600', ring: 'ring-amber-200', gradient: 'from-amber-500 to-orange-600' },
  };

  const colors = accentColors[userRole] || accentColors.admin;

  return (
    <>
      {/* MOBILE HEADER */}
      <div className="lg:hidden fixed top-0 left-0 z-50 w-full bg-white/70 backdrop-blur-xl border-b border-white/20 px-4 h-16 flex items-center justify-between shadow-sm">
        <div className={cn("flex items-center gap-2 font-bold text-lg", colors.text)}>
          <BookOpen size={24} className="animate-pulse" />
          <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            SchoolAdmin
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Notification Center - Mobile */}
          <ModeToggle />
          <NotificationCenter />
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 text-slate-600 hover:bg-white/50 rounded-xl transition-all active:scale-95"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* MOBILE OVERLAY */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/20 z-40 lg:hidden backdrop-blur-sm transition-all duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside className={cn(
        "fixed top-0 left-0 z-50 h-screen w-64 bg-white/70 backdrop-blur-xl border-r border-white/20 flex flex-col transition-all duration-500 ease-out lg:translate-x-0 pt-16 lg:pt-0 shadow-2xl lg:shadow-none",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>

        {/* LOGO AREA with gradient border */}
        <div className="hidden lg:flex h-16 items-center justify-between border-b border-slate-200/50 px-6 shrink-0 relative overflow-hidden">
          <div className={cn("absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r", colors.gradient, "opacity-50")} />
          <div className="flex items-center gap-2.5 group cursor-pointer" onClick={() => navigate('/')}>
            <div className={cn(
              "p-2 rounded-xl bg-gradient-to-br shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:rotate-3",
              colors.gradient
            )}>
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">School</span>
              <span className={cn("bg-gradient-to-r bg-clip-text text-transparent", colors.gradient)}>Admin</span>
            </span>
          </div>
          {/* Notification Center - Desktop */}
          <div className="flex items-center gap-2">
            <ModeToggle />
            <NotificationCenter />
          </div>
        </div>

        {/* NAVIGATION */}
        <div className="flex-1 overflow-y-auto px-3 py-5 scrollbar-thin scrollbar-thumb-slate-200">
          <div className="mb-3 px-3 text-[10px] font-bold uppercase text-slate-400 tracking-widest flex items-center gap-2">
            <Sparkles className="h-3 w-3" />
            Navigation
          </div>
          <nav className="space-y-1.5">
            {links.map((link, index) => {
              const Icon = link.icon;
              const isHovered = hoveredLink === link.href;

              return (
                <NavLink
                  key={link.href}
                  to={link.href}
                  onClick={() => setIsOpen(false)}
                  onMouseEnter={() => setHoveredLink(link.href)}
                  onMouseLeave={() => setHoveredLink(null)}
                  className={({ isActive }) =>
                    cn(
                      "relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 group overflow-hidden",
                      isActive
                        ? cn("bg-gradient-to-r shadow-lg text-white", colors.gradient)
                        : "text-slate-600 hover:bg-slate-100/80 hover:shadow-md"
                    )
                  }
                  style={{
                    animationDelay: `${index * 50}ms`
                  }}
                >
                  {({ isActive }) => (
                    <>
                      {/* Hover glow effect */}
                      {isHovered && !isActive && (
                        <div className={cn(
                          "absolute inset-0 bg-gradient-to-r opacity-10 transition-opacity duration-300",
                          colors.gradient
                        )} />
                      )}

                      {/* Icon with animation */}
                      <div className={cn(
                        "relative z-10 p-1.5 rounded-lg transition-all duration-300",
                        isActive ? "bg-white/20" : "bg-transparent group-hover:bg-slate-200/50",
                        isHovered && !isActive && "scale-110 rotate-6"
                      )}>
                        <Icon
                          size={18}
                          className={cn(
                            "transition-all duration-300",
                            isActive ? "text-white" : cn("text-slate-500 group-hover:", colors.text),
                            isHovered && !isActive && "animate-bounce"
                          )}
                        />
                      </div>

                      {/* Label with slide effect */}
                      <span className={cn(
                        "relative z-10 transition-all duration-300",
                        isActive ? "text-white font-semibold" : "",
                        isHovered && !isActive && "translate-x-1"
                      )}>
                        {link.label}
                      </span>

                      {/* Active indicator dot */}
                      {isActive && (
                        <div className="absolute right-3 w-2 h-2 rounded-full bg-white/80 animate-pulse" />
                      )}

                      {/* Hover arrow */}
                      {isHovered && !isActive && (
                        <div className="absolute right-3 text-slate-400 animate-in slide-in-from-left-2 duration-200">
                          →
                        </div>
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* USER PROFILE FOOTER */}
        <div className="border-t border-slate-200/50 p-4 bg-gradient-to-t from-slate-100/50 to-transparent">
          <div className="flex items-center gap-3 mb-4 px-2 py-2 rounded-xl hover:bg-white/80 transition-all duration-300 cursor-pointer group">
            {/* Avatar with ring animation */}
            <div className="relative">
              <div className={cn(
                "h-10 w-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl bg-gradient-to-br",
                colors.gradient
              )}>
                {userInitials}
              </div>
              {/* Online indicator */}
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white animate-pulse" />
            </div>
            <div className="overflow-hidden flex-1">
              <p className="truncate text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                {userName}
              </p>
              <p className={cn(
                "truncate text-xs font-medium capitalize transition-colors",
                colors.text
              )}>
                {userRole.replace('_', ' ')}
              </p>
            </div>
          </div>

          {/* Logout button with hover animation */}
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 hover:shadow-md border border-transparent hover:border-red-200 transition-all duration-300 group active:scale-98"
          >
            <div className="p-1.5 rounded-lg bg-red-100 group-hover:bg-red-200 transition-colors">
              <LogOut size={16} className="group-hover:-translate-x-1 transition-transform duration-300" />
            </div>
            <span className="group-hover:translate-x-0.5 transition-transform duration-300">
              Sign Out
            </span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default SidebarShell;