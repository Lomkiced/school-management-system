import { FileText, LayoutDashboard, LogOut } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../store/authStore';

export const StudentSidebar = () => {
  const location = useLocation();
  const logout = useAuthStore((state) => state.logout);

  return (
    <div className="h-screen w-64 bg-emerald-900 text-white flex flex-col fixed left-0 top-0">
      <div className="p-6 border-b border-emerald-800">
        <h2 className="text-xl font-bold">Student Portal</h2>
        <p className="text-xs text-emerald-200">My School Account</p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        <Link to="/student/dashboard" className={cn("flex items-center gap-3 px-4 py-3 rounded-lg transition-colors", location.pathname === "/student/dashboard" ? "bg-emerald-700" : "hover:bg-emerald-800")}> 
          <LayoutDashboard size={20} /> <span className="font-medium">Overview</span>
        </Link>
        <Link to="/student/grades" className={cn("flex items-center gap-3 px-4 py-3 rounded-lg transition-colors", location.pathname === "/student/grades" ? "bg-emerald-700" : "hover:bg-emerald-800")}> 
          <FileText size={20} /> <span className="font-medium">My Grades</span>
        </Link>
      </nav>

      <div className="p-4 border-t border-emerald-800">
        <button onClick={logout} className="flex items-center gap-3 px-4 py-3 w-full text-emerald-200 hover:bg-emerald-800 rounded-lg">
          <LogOut size={20} /> <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};