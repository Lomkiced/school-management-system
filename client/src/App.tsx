import { useEffect } from 'react';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { useAuthStore } from './store/authStore';

// Layouts
import { DashboardLayout } from './components/layout/DashboardLayout';
import { StudentLayout } from './components/layout/StudentLayout';
import { TeacherLayout } from './components/layout/TeacherLayout';

// Auth
import { LoginForm } from './features/auth/LoginForm';

// Dashboard
import { Dashboard } from './features/dashboard/Dashboard';

// Students
import { AddStudent } from './features/students/AddStudent';
import { EnrollStudent } from './features/students/EnrollStudent';
import { StudentGrades } from './features/students/StudentGrades';
import { StudentList } from './features/students/StudentList';

// Teachers
import { AddTeacher } from './features/teachers/AddTeacher';
import { TeacherDashboard } from './features/teachers/TeacherDashboard';
import { TeacherList } from './features/teachers/TeacherList';

// Classes
import { AddClass } from './features/classes/AddClass';
import { ClassList } from './features/classes/ClassList';
import { Gradebook } from './features/classes/Gradebook';

// Finance
import { FeeList } from './features/finance/FeeList';
import { StudentLedger } from './features/finance/StudentLedger';

// Settings
import { Toaster } from 'sonner';
import { Settings } from './features/settings/Settings';

function App() {
  // 1. Get the initialize function from our store
  const initialize = useAuthStore((state) => state.initialize);

  // 2. Check for an existing login token immediately when the app loads
  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <Router>
      {/* 2. ADD THIS LINE HERE (Inside Router, before Routes) */}
      <Toaster position="top-right" richColors closeButton />
      <Routes>
        {/* === PUBLIC ROUTES === */}
        <Route path="/login" element={<LoginForm />} />

        {/* === ADMIN PORTAL (Protected by DashboardLayout) === */}
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          
          {/* Student Management */}
          <Route path="/students" element={<StudentList />} />
          <Route path="/students/new" element={<AddStudent />} />
          <Route path="/students/enroll" element={<EnrollStudent />} />
          
          {/* Teacher Management */}
          <Route path="/teachers" element={<TeacherList />} />
          <Route path="/teachers/new" element={<AddTeacher />} />
          
          {/* Class & Academic Management */}
          <Route path="/classes" element={<ClassList />} />
          <Route path="/classes/new" element={<AddClass />} />
          <Route path="/classes/:classId/grading" element={<Gradebook />} />

          {/* Financial Management */}
          <Route path="/finance" element={<FeeList />} />
          <Route path="/students/:studentId/ledger" element={<StudentLedger />} />

          {/* System Settings (MOVED HERE so the Sidebar stays visible) */}
          <Route path="/settings" element={<Settings />} />
        </Route>

        {/* === STUDENT PORTAL (Protected by StudentLayout) === */}
        <Route path="/student" element={<StudentLayout />}>
          <Route path="dashboard" element={<div className="text-2xl font-bold">Welcome, Student!</div>} />
          <Route path="grades" element={<StudentGrades />} />
        </Route>

        {/* === TEACHER PORTAL (Protected by TeacherLayout) === */}
        <Route path="/teacher" element={<TeacherLayout />}>
          <Route path="dashboard" element={<TeacherDashboard />} />
          {/* Reuse the Gradebook component! */}
          <Route path="grading/:classId" element={<Gradebook />} />
        </Route>

        {/* === DEFAULT REDIRECT === */}
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;