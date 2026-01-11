// FILE: client/src/components/layout/DashboardLayout.tsx
import { Navigate, Outlet } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../store/authStore';
import { useSidebarStore } from '../../store/sidebarStore'; // Import the store
import { Sidebar } from './Sidebar';

export const DashboardLayout = () => {
  const { user, token } = useAuthStore();
  const { isExpanded } = useSidebarStore(); // Listen to global state

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* 1. The Fixed Sidebar */}
      <Sidebar />

      {/* 2. Main Content Area with Dynamic Padding */}
      {/* Moves content to the right when sidebar expands */}
      <main 
        className={cn(
          "pt-16 md:pt-0 w-full min-h-screen transition-all duration-300 ease-in-out",
          isExpanded ? "md:pl-64" : "md:pl-[70px]"
        )}
      >
        <div className="container mx-auto p-6 md:p-8 max-w-7xl animate-in fade-in duration-500">
          <Outlet />
        </div>
      </main>
    </div>
  );
};