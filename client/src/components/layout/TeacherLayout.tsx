import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { TeacherSidebar } from './TeacherSidebar';

export const TeacherLayout = () => {
  const user = useAuthStore((state) => state.user);
  if (!user) return <Navigate to="/login" replace />;
  // Security Check: Kick out students/admins
  // if (user.role !== 'TEACHER') return <Navigate to="/login" replace />; 

  return (
    <div className="min-h-screen bg-slate-50">
      <TeacherSidebar />
      <main className="ml-64 p-8">
        <div className="max-w-7xl mx-auto"><Outlet /></div>
      </main>
    </div>
  );
};