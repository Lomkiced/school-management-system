import { LayoutDashboard, LogOut } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../store/authStore';

export const TeacherSidebar = () => {
  const location = useLocation();
  const logout = useAuthStore((state) => state.logout);

  return (
    <div className="h-screen w-64 bg-indigo-900 text-white flex flex-col fixed left-0 top-0">
      <div className="p-6 border-b border-indigo-800">
        <h2 className="text-xl font-bold">Faculty Portal</h2>
        <p className="text-xs text-indigo-200">Teacher Access</p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        <Link to="/teacher/dashboard" className={cn("flex items-center gap-3 px-4 py-3 rounded-lg transition-colors", location.pathname === "/teacher/dashboard" ? "bg-indigo-700" : "hover:bg-indigo-800")}> 
          <LayoutDashboard size={20} /> <span className="font-medium">My Schedule</span>
        </Link>
      </nav>

      <div className="p-4 border-t border-indigo-800">
        <button onClick={logout} className="flex items-center gap-3 px-4 py-3 w-full text-indigo-200 hover:bg-indigo-800 rounded-lg">
          <LogOut size={20} /> <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};