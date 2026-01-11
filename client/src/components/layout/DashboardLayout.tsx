// FILE: client/src/components/layout/DashboardLayout.tsx
import { Outlet } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { useSidebarStore } from '../../store/sidebarStore'; // <--- IMPORT STORE
import { Sidebar } from './Sidebar';

export const DashboardLayout = () => {
  const { isExpanded } = useSidebarStore(); // <--- READ STATE

  return (
    <div className="min-h-screen bg-slate-50/50">
      <Sidebar />
      {/* Dynamic Padding based on State */}
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