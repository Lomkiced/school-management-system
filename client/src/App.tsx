// FILE: client/src/App.tsx
import { Suspense, lazy, useEffect } from 'react';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { useAuthStore } from './store/authStore';

// === 1. LAZY LOAD COMPONENTS ===
const DashboardLayout = lazy(() => import('./components/layout/DashboardLayout').then(m => ({ default: m.DashboardLayout })));
const StudentLayout = lazy(() => import('./components/layout/StudentLayout').then(m => ({ default: m.StudentLayout })));
const TeacherLayout = lazy(() => import('./components/layout/TeacherLayout').then(m => ({ default: m.TeacherLayout })));

// Auth
const LoginForm = lazy(() => import('./features/auth/LoginForm').then(m => ({ default: m.LoginForm })));

// Dashboard
const Dashboard = lazy(() => import('./features/dashboard/Dashboard').then(m => ({ default: m.Dashboard })));

// Students
const StudentList = lazy(() => import('./features/students/StudentList').then(m => ({ default: m.StudentList })));
const AddStudent = lazy(() => import('./features/students/AddStudent').then(m => ({ default: m.AddStudent })));
const EnrollStudent = lazy(() => import('./features/students/EnrollStudent').then(m => ({ default: m.EnrollStudent })));
const StudentGrades = lazy(() => import('./features/students/StudentGrades').then(m => ({ default: m.StudentGrades })));

// Teachers
const TeacherList = lazy(() => import('./features/teachers/TeacherList').then(m => ({ default: m.TeacherList })));
const AddTeacher = lazy(() => import('./features/teachers/AddTeacher').then(m => ({ default: m.AddTeacher })));
const TeacherDashboard = lazy(() => import('./features/teachers/TeacherDashboard').then(m => ({ default: m.TeacherDashboard })));

// Classes
const ClassList = lazy(() => import('./features/classes/ClassList').then(m => ({ default: m.ClassList })));
const AddClass = lazy(() => import('./features/classes/AddClass').then(m => ({ default: m.AddClass })));
const Gradebook = lazy(() => import('./features/classes/Gradebook').then(m => ({ default: m.Gradebook })));

// Finance
const FeeList = lazy(() => import('./features/finance/FeeList').then(m => ({ default: m.FeeList })));
const StudentLedger = lazy(() => import('./features/finance/StudentLedger').then(m => ({ default: m.StudentLedger })));

// Settings
const Settings = lazy(() => import('./features/settings/Settings').then(m => ({ default: m.Settings })));

// LMS (Quiz)
const QuizPlayer = lazy(() => import('./features/lms/QuizPlayer').then(m => ({ default: m.QuizPlayer })));
const QuizBuilder = lazy(() => import('./features/lms/QuizBuilder').then(m => ({ default: m.QuizBuilder })));

// === 2. LOADING SPINNER ===
const LoadingScreen = () => (
  <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 gap-4">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
    <p className="text-sm text-slate-500">Loading Module...</p>
  </div>
);

function App() {
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    // Attempt to restore session
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

            {/* === CRITICAL FIX: QUIZ MODE IS NOW STANDALONE === */}
            {/* This ensures it works for both Students and Teachers without sidebar distractions */}
            <Route path="/quiz/:quizId" element={<QuizPlayer />} />

            {/* Admin / Staff Portal */}
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

            {/* Student Portal */}
            <Route path="/student" element={<StudentLayout />}>
              <Route path="dashboard" element={<div className="p-8 text-2xl font-bold">Student Dashboard</div>} />
              <Route path="grades" element={<StudentGrades />} />
              {/* QUIZ ROUTE REMOVED FROM HERE */}
            </Route>

            {/* Teacher Portal */}
            <Route path="/teacher" element={<TeacherLayout />}>
              <Route path="dashboard" element={<TeacherDashboard />} />
              <Route path="grading/:classId" element={<Gradebook />} />
              <Route path="class/:classId/quiz/new" element={<QuizBuilder />} />
            </Route>

            {/* Default */}
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </Router>
  );
}

export default App;