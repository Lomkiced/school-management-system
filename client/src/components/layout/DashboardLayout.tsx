import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/store/authStore';
import { Bell, Search } from 'lucide-react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar'; // <--- FIXED: Removed { } braces

export function DashboardLayout() {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* SIDEBAR */}
      <aside className="hidden md:block">
        <Sidebar />
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* TOP HEADER */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm z-10">
          
          {/* SEARCH BAR */}
          <div className="w-96 relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search anything..." 
              className="pl-9 bg-slate-50 border-slate-200 focus-visible:ring-blue-500" 
            />
          </div>

          {/* USER PROFILE & NOTIFICATIONS */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5 text-slate-600" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full border border-white" />
            </Button>
            
            <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-slate-900 leading-none">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-slate-500 mt-1 capitalize">
                  {user?.role?.replace('_', ' ')}
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold shadow-md">
                {user?.firstName?.[0] || 'U'}
              </div>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT WRAPPER */}
        <main className="flex-1 overflow-y-auto p-8 relative">
          <div className="mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}