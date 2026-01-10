import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { StudentSidebar } from './StudentSidebar';

export const StudentLayout = () => {
  const user = useAuthStore((state) => state.user);

  if (!user) return <Navigate to="/login" replace />;
  // Security: If an Admin tries to go here, kick them out (optional, but good practice)
  // if (user.role !== 'STUDENT') return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen bg-slate-50">
      <StudentSidebar />
      <main className="ml-64 p-8">
        <div className="max-w-7xl mx-auto"><Outlet /></div>
      </main>
    </div>
  );
};