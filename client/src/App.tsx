import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';

// Features - Auth
import LoginForm from './features/auth/LoginForm';

// Features - Dashboards
import Dashboard from './features/dashboard/Dashboard'; // Admin
import ParentDashboard from './features/parent/ParentDashboard'; // <--- NEW
import StudentDashboard from './features/students/StudentDashboard';
import TeacherDashboard from './features/teachers/TeacherDashboard';

// Layouts
import DashboardLayout from './components/layout/DashboardLayout'; // Admin Layout
import ParentLayout from './components/layout/ParentLayout'; // <--- NEW
import StudentLayout from './components/layout/StudentLayout';
import TeacherLayout from './components/layout/TeacherLayout';

// Guards (Assuming you might have a generic ProtectedRoute wrapper, 
// if not, we use this simple inline check or your existing one)
import { useAuthStore } from './store/authStore';

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode, allowedRoles: string[] }) {
  const { user, isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        {/* PUBLIC ROUTES */}
        <Route path="/login" element={<LoginForm />} />
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* ADMIN ROUTES */}
        <Route 
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          {/* Add other admin routes here */}
        </Route>

        {/* TEACHER ROUTES */}
        <Route 
          element={
            <ProtectedRoute allowedRoles={['TEACHER']}>
              <TeacherLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
        </Route>

        {/* STUDENT ROUTES */}
        <Route 
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <StudentLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/student/dashboard" element={<StudentDashboard />} />
        </Route>

        {/* === PARENT ROUTES (NEW) === */}
        <Route 
          element={
            <ProtectedRoute allowedRoles={['PARENT']}>
              <ParentLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/parent/dashboard" element={<ParentDashboard />} />
          <Route path="/parent/children" element={<div>Children List (Coming Soon)</div>} />
          <Route path="/parent/fees" element={<div>Fee Status (Coming Soon)</div>} />
        </Route>

        {/* CATCH ALL */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}