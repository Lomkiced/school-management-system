// FILE: client/src/App.tsx
import { Suspense, lazy, useEffect } from 'react';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { useAuthStore } from './store/authStore';

// === 1. LAZY LOADING (STANDARD) ===
// We assume these files use "export default ComponentName"
// This is the standard, crash-proof way to load routes.

// Layouts
const DashboardLayout = lazy(() => import('./components/layout/DashboardLayout').then(module => ({ default: module.DashboardLayout })));
const StudentLayout = lazy(() => import('./components/layout/StudentLayout').then(module => ({ default: module.StudentLayout })));
const TeacherLayout = lazy(() => import('./components/layout/TeacherLayout').then(module => ({ default: module.TeacherLayout })));
// FIX: Standard import for ParentLayout (since we added export default)
const ParentLayout = lazy(() => import('./components/layout/ParentLayout'));

// Auth
const LoginForm = lazy(() => import('./features/auth/LoginForm').then(module => ({ default: module.LoginForm })));

// Dashboards
const Dashboard = lazy(() => import('./features/dashboard/Dashboard').then(module => ({ default: module.Dashboard })));
const StudentDashboard = lazy(() => import('./features/students/StudentDashboard').then(module => ({ default: module.StudentDashboard })));
const TeacherDashboard = lazy(() => import('./features/teachers/TeacherDashboard').then(module => ({ default: module.TeacherDashboard })));
const ParentDashboard = lazy(() => import('./features/parent/ParentDashboard').then(module => ({ default: module.ParentDashboard })));

// Features
const StudentList = lazy(() => import('./features/students/StudentList').then(module => ({ default: module.StudentList })));
const AddStudent = lazy(() => import('./features/students/AddStudent').then(module => ({ default: module.AddStudent })));
const EnrollStudent = lazy(() => import('./features/students/EnrollStudent').then(module => ({ default: module.EnrollStudent })));
const StudentGrades = lazy(() => import('./features/students/StudentGrades').then(module => ({ default: module.StudentGrades })));
const TeacherList = lazy(() => import('./features/teachers/TeacherList').then(module => ({ default: module.TeacherList })));
const AddTeacher = lazy(() => import('./features/teachers/AddTeacher').then(module => ({ default: module.AddTeacher })));
const ClassList = lazy(() => import('./features/classes/ClassList').then(module => ({ default: module.ClassList })));
const AddClass = lazy(() => import('./features/classes/AddClass').then(module => ({ default: module.AddClass })));
const Gradebook = lazy(() => import('./features/classes/Gradebook').then(module => ({ default: module.Gradebook })));
const FeeList = lazy(() => import('./features/finance/FeeList').then(module => ({ default: module.FeeList })));
const StudentLedger = lazy(() => import('./features/finance/StudentLedger').then(module => ({ default: module.StudentLedger })));
const Settings = lazy(() => import('./features/settings/Settings').then(module => ({ default: module.Settings })));

// LMS
const QuizPlayer = lazy(() => import('./features/lms/QuizPlayer').then(module => ({ default: module.QuizPlayer })));
const QuizBuilder = lazy(() => import('./features/lms/QuizBuilder').then(module => ({ default: module.QuizBuilder })));

// === 2. LOADING SCREEN ===
const LoadingScreen = () => (
  <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 gap-4">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
    <p className="text-sm text-slate-500">Loading Module...</p>
  </div>
);

function App() {
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <Router>
      <ErrorBoundary>
        <Toaster position="top-right" richColors closeButton />
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<LoginForm />} />
            
            {/* Standalone */}
            <Route path="/quiz/:quizId" element={<QuizPlayer />} />

            {/* === ADMIN PORTAL === */}
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/students" element={<StudentList />} />
              <Route path="/students/new" element={<AddStudent />} />
              <Route path="/students/enroll" element={<EnrollStudent />} />
              <Route path="/teachers" element={<TeacherList />} />
              <Route path="/teachers/new" element={<AddTeacher />} />
              <Route path="/classes" element={<ClassList />} />
              <Route path="/classes/new" element={<AddClass />} />
              <Route path="/classes/:classId/grading" element={<Gradebook />} />
              <Route path="/finance" element={<FeeList />} />
              <Route path="/students/:studentId/ledger" element={<StudentLedger />} />
              <Route path="/settings" element={<Settings />} />
            </Route>

            {/* === STUDENT PORTAL === */}
            <Route path="/student" element={<StudentLayout />}>
              <Route path="dashboard" element={<StudentDashboard />} />
              <Route path="grades" element={<StudentGrades />} />
            </Route>

            {/* === TEACHER PORTAL === */}
            <Route path="/teacher" element={<TeacherLayout />}>
              <Route path="dashboard" element={<TeacherDashboard />} />
              <Route path="grading/:classId" element={<Gradebook />} />
              <Route path="class/:classId/quiz/new" element={<QuizBuilder />} />
            </Route>

            {/* === PARENT PORTAL === */}
            <Route path="/parent" element={<ParentLayout />}>
              <Route path="dashboard" element={<ParentDashboard />} />
            </Route>

            {/* Fallback */}
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </Router>
  );
}

export default App;