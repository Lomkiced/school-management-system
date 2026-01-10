import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { SearchCommand } from '../ui/SearchCommand'; // Import the new Command Palette
import { Sidebar } from './Sidebar';

export const DashboardLayout = () => {
  const user = useAuthStore((state) => state.user);

  // Protection: If no user is logged in, kick them back to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* 1. Sidebar is fixed on the left */}
      <Sidebar />
      
      {/* 2. Command Palette (Invisible until Ctrl+K is pressed) */}
      <SearchCommand /> 
      
      {/* 3. Main Content Area (pushed 64 units/16rem to the right) */}
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Outlet renders the child route (e.g., Dashboard, Students page) */}
          <Outlet /> 
        </div>
      </main>
    </div>
  );
};