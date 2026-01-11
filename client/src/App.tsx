// FILE: client/src/App.tsx
import { Suspense, lazy, useEffect } from 'react';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { useAuthStore } from './store/authStore';

// === 1. SMART LAZY LOADER ===
// This helper function automatically finds the component whether it's
// exported as "default" OR as a named export (like "Dashboard").
// It prevents the "Cannot convert object to primitive value" crash.
const load = (importPromise: Promise<any>, name?: string) => {
  return lazy(() => 
    importPromise.then(module => {
      // Case A: Named export found (e.g., export const Dashboard)
      if (name && module[name]) {
        return { default: module[name] };
      }
      // Case B: Default export found (e.g., export default Dashboard)
      if (module.default) {
        return { default: module.default };
      }
      // Case C: Fallback (prevents crash, shows error)
      throw new Error(`Module loaded but component ${name || 'Default'} was not found.`);
    })
  );
};

// === 2. SAFE IMPORTS ===

// Layouts
const DashboardLayout = load(import('./components/layout/DashboardLayout'), 'DashboardLayout');
const StudentLayout = load(import('./components/layout/StudentLayout'), 'StudentLayout');
const TeacherLayout = load(import('./components/layout/TeacherLayout'), 'TeacherLayout');
const ParentLayout = load(import('./components/layout/ParentLayout'), 'ParentLayout');

// Auth (FIXED: Handles Default Export correctly now)
const LoginForm = load(import('./features/auth/LoginForm'), 'LoginForm');

// Dashboards
const Dashboard = load(import('./features/dashboard/Dashboard'), 'Dashboard');
const StudentDashboard = load(import('./features/students/StudentDashboard'), 'StudentDashboard');
const TeacherDashboard = load(import('./features/teachers/TeacherDashboard'), 'TeacherDashboard');
const ParentDashboard = load(import('./features/parent/ParentDashboard'), 'ParentDashboard');

// Features
const StudentList = load(import('./features/students/StudentList'), 'StudentList');
const AddStudent = load(import('./features/students/AddStudent'), 'AddStudent');
const EnrollStudent = load(import('./features/students/EnrollStudent'), 'EnrollStudent');
const StudentGrades = load(import('./features/students/StudentGrades'), 'StudentGrades');

const TeacherList = load(import('./features/teachers/TeacherList'), 'TeacherList');
const AddTeacher = load(import('./features/teachers/AddTeacher'), 'AddTeacher');

const ClassList = load(import('./features/classes/ClassList'), 'ClassList');
const AddClass = load(import('./features/classes/AddClass'), 'AddClass');
const Gradebook = load(import('./features/classes/Gradebook'), 'Gradebook');

const FeeList = load(import('./features/finance/FeeList'), 'FeeList');
const StudentLedger = load(import('./features/finance/StudentLedger'), 'StudentLedger');

const Settings = load(import('./features/settings/Settings'), 'Settings');

// LMS
const QuizPlayer = load(import('./features/lms/QuizPlayer'), 'QuizPlayer');
const QuizBuilder = load(import('./features/lms/QuizBuilder'), 'QuizBuilder');

// === 3. LOADING SCREEN ===
const LoadingScreen = () => (
  <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 gap-4">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
    <p className="text-sm text-slate-500">Loading Application...</p>
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