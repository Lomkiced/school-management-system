import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Sidebar } from './Sidebar';

export const DashboardLayout = () => {
  const { user, token } = useAuthStore();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  return (
    // 1. FLEX CONTAINER: Forces side-by-side layout
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden">
      
      {/* 2. SIDEBAR: Fixed width, never shrinks */}
      <aside className="w-64 flex-shrink-0 h-full border-r border-slate-200 bg-white shadow-sm z-10 hidden md:block">
        <Sidebar />
      </aside>

      {/* 3. MAIN CONTENT: Takes remaining space */}
      <main className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
           <Outlet />
        </div>
      </main>
    </div>
  );
};