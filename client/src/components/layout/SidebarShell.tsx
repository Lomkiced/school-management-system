// FILE: client/src/components/layout/SidebarShell.tsx
import { LogOut, Menu, PanelLeftClose, PanelLeftOpen, X } from 'lucide-react';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../store/authStore';
import { useSidebarStore } from '../../store/sidebarStore';
import { Button } from '../ui/button';

interface SidebarLink {
  label: string;
  href: string;
  icon: any;
  color?: string;
}

interface SidebarShellProps {
  title: string;
  links: SidebarLink[];
  colorTheme?: 'indigo' | 'emerald' | 'orange' | 'slate';
}

export const SidebarShell = ({ title, links, colorTheme = 'indigo' }: SidebarShellProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuthStore();
  const { isExpanded, toggle } = useSidebarStore();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const themeColors = {
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-600",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-600",
    orange: "bg-orange-50 text-orange-600 border-orange-600",
    slate: "bg-slate-100 text-slate-900 border-slate-900",
  };

  const isActive = (path: string) => {
    if (path === '/dashboard' || path === '/teacher/dashboard' || path === '/student/dashboard') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const getActiveStyle = (active: boolean) => {
    if (!active) return "text-slate-500 hover:text-slate-900 hover:bg-slate-50 border-transparent";
    return `${themeColors[colorTheme]} border-r-4`;
  };

  return (
    <>
      {/* === MOBILE HEADER === */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b z-50 flex items-center justify-between px-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
            {title.charAt(0)}
          </div>
          <div className="font-bold text-lg text-slate-800">{title}</div>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsMobileOpen(!isMobileOpen)}>
          {isMobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* === MOBILE DRAWER === */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-white pt-20 px-4 animate-in slide-in-from-left-10 duration-200">
           <div className="space-y-2">
            {links.map((link) => (
              <button
                key={link.href}
                onClick={() => { navigate(link.href); setIsMobileOpen(false); }}
                className={cn(
                  "w-full flex items-center gap-4 px-4 py-3 rounded-lg text-sm font-medium transition-all",
                  isActive(link.href) ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:bg-slate-50"
                )}
              >
                <link.icon className="h-5 w-5" />
                {link.label}
              </button>
            ))}
            <button onClick={() => { logout(); navigate('/login'); }} className="w-full flex items-center gap-4 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg mt-8 border border-red-100">
              <LogOut className="h-5 w-5" /> Sign Out
            </button>
           </div>
        </div>
      )}

      {/* === DESKTOP SIDEBAR === */}
      <div className="hidden md:block fixed inset-y-0 left-0 z-50">
        <aside
          className={cn(
            "h-full bg-white border-r border-slate-200 shadow-2xl transition-all duration-300 ease-in-out flex flex-col relative",
            isExpanded ? "w-64" : "w-[70px]" 
          )}
        >
          {/* HEADER */}
          <div className="h-16 flex items-center border-b border-slate-100 shrink-0 bg-white overflow-hidden relative">
             <div className="w-[70px] flex items-center justify-center shrink-0">
                <div className="h-9 w-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-200">
                  {title.charAt(0)}
                </div>
             </div>
             
             <div className={cn(
               "transition-all duration-300 whitespace-nowrap overflow-hidden flex-1",
               isExpanded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
             )}>
               <span className="font-bold text-lg text-slate-800 tracking-tight">{title}</span>
             </div>
          </div>

          {/* === UPGRADED TOGGLE BUTTON === */}
          {/* - Increased size (h-8 w-8)
              - Added clear icon (PanelLeftClose/Open)
              - Added ring for focus/hover visibility
              - Positioned exactly halfway (-right-4)
          */}
          <button 
            onClick={toggle}
            className="absolute -right-4 top-[20px] h-8 w-8 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-md text-slate-600 hover:text-indigo-600 hover:border-indigo-300 hover:shadow-lg transition-all z-50 ring-2 ring-transparent hover:ring-indigo-100"
            title={isExpanded ? "Collapse Sidebar" : "Expand Sidebar"}
          >
            {isExpanded ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
          </button>

          {/* NAV ITEMS */}
          <div className="flex-1 py-6 space-y-1 overflow-y-auto overflow-x-hidden">
            {links.map((link) => {
              const active = isActive(link.href);
              return (
                <button
                  key={link.href}
                  onClick={() => navigate(link.href)}
                  className={cn(
                    "w-full flex items-center h-12 relative transition-all duration-200 group",
                    getActiveStyle(active)
                  )}
                >
                  {/* Icon Area */}
                  <div className="w-[70px] flex items-center justify-center shrink-0">
                    <link.icon className={cn(
                      "h-5 w-5 transition-transform duration-300", 
                      isExpanded ? "" : "group-hover:scale-110",
                      link.color && !active ? link.color : ""
                    )} />
                  </div>
                  
                  {/* Label */}
                  <span className={cn(
                    "whitespace-nowrap font-medium text-sm transition-all duration-300 origin-left",
                    isExpanded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 hidden"
                  )}>
                    {link.label}
                  </span>

                  {/* TOOLTIP (Collapsed Mode) */}
                  {!isExpanded && (
                    <div className="absolute left-[60px] ml-4 px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-xl translate-x-2 group-hover:translate-x-0 duration-200">
                      {link.label}
                      <div className="absolute top-1/2 -left-1 -mt-1 border-4 border-transparent border-r-slate-900" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* FOOTER */}
          <div className="border-t border-slate-100 p-3 bg-slate-50/50 overflow-hidden">
             <div className={cn("flex items-center rounded-xl p-1.5 transition-all cursor-default", isExpanded ? "bg-white shadow-sm border border-slate-100" : "")}>
                <div className="h-9 w-9 rounded-full bg-slate-200 flex items-center justify-center shrink-0 text-slate-600 font-bold border-2 border-white shadow-sm">
                   {user?.firstName?.charAt(0) || 'U'}
                </div>
                
                <div className={cn("ml-3 overflow-hidden transition-all duration-300", isExpanded ? "w-auto opacity-100" : "w-0 opacity-0")}>
                   <p className="text-sm font-bold text-slate-900 truncate">{user?.firstName}</p>
                   <p className="text-[10px] uppercase font-bold text-slate-400 truncate">{user?.role}</p>
                </div>

                <button 
                  onClick={() => { logout(); navigate('/login'); }}
                  className={cn("ml-auto hover:bg-red-50 p-2 rounded-lg text-slate-400 hover:text-red-600 transition-all", isExpanded ? "block" : "hidden")}
                  title="Logout"
                >
                   <LogOut className="h-4 w-4" />
                </button>
             </div>
          </div>
        </aside>
      </div>
    </>
  );
};