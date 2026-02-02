// FILE: client/src/App.tsx
// 2026 Standard: Role-based routing with protected routes

import { Suspense, lazy, useEffect } from 'react';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { useAuthStore } from './store/authStore';
import { ThemeProvider } from './components/ui/ThemeProvider';

// Dynamic import helper with named export support
const load = (importPromise: Promise<any>, name?: string) => {
  return lazy(() =>
    importPromise.then(module => {
      if (name && module[name]) return { default: module[name] };
      if (module.default) return { default: module.default };
      throw new Error(`Module loaded but component ${name || 'Default'} was not found.`);
    })
  );
};

// ================= LAYOUTS =================
const DashboardLayout = load(import('./components/layout/DashboardLayout'), 'DashboardLayout');
const StudentLayout = load(import('./components/layout/StudentLayout'), 'StudentLayout');
const TeacherLayout = load(import('./components/layout/TeacherLayout'), 'TeacherLayout');
const ParentLayout = load(import('./components/layout/ParentLayout'), 'ParentLayout');

// ================= AUTH =================
const LoginForm = load(import('./features/auth/LoginForm'), 'LoginForm');

// ================= DASHBOARDS =================
const Dashboard = load(import('./features/dashboard/Dashboard'), 'Dashboard');
const StudentDashboard = load(import('./features/students/StudentDashboard'), 'StudentDashboard');
const TeacherDashboard = load(import('./features/teachers/TeacherDashboard'), 'TeacherDashboard');
const ParentDashboard = load(import('./features/parents/ParentDashboard'), 'ParentDashboard');

// ================= STUDENTS =================
// ================= STUDENTS =================
const StudentManager = load(import('./features/people/students/StudentManager'), 'StudentManager');
const AddStudent = load(import('./features/students/AddStudent'), 'AddStudent');
const EnrollStudent = load(import('./features/students/EnrollStudent'), 'EnrollStudent');
const StudentGrades = load(import('./features/students/StudentGrades'), 'StudentGrades');

// ================= TEACHERS =================
const FacultyManager = load(import('./features/people/faculty/FacultyManager'), 'FacultyManager');
const AddTeacher = load(import('./features/teachers/AddTeacher'), 'AddTeacher');
const TeacherClasses = load(import('./features/teachers/TeacherClasses'), 'TeacherClasses');
const TeacherGradebook = load(import('./features/teachers/TeacherGradebook'), 'TeacherGradebook');

// ================= PARENTS =================
const ParentList = load(import('./features/parents/ParentList'), 'ParentList');

// ================= CLASSES =================
const ClassList = load(import('./features/classes/ClassList'), 'ClassList');
const AddClass = load(import('./features/classes/AddClass'), 'AddClass');
const Gradebook = load(import('./features/classes/Gradebook'), 'Gradebook');

// ================= FINANCE =================
const FeeList = load(import('./features/finance/FeeList'), 'FeeList');
const StudentLedger = load(import('./features/finance/StudentLedger'), 'StudentLedger');

// ================= SETTINGS =================
const Settings = load(import('./features/settings/Settings'), 'Settings');

// ================= LMS =================
const QuizPlayer = load(import('./features/lms/QuizPlayer'), 'QuizPlayer');
const QuizBuilder = load(import('./features/lms/QuizBuilder'), 'QuizBuilder');

// ================= STUDENT LMS =================
const StudentClasses = load(import('./features/students/StudentClasses'), 'StudentClasses');
const StudentClassDetail = load(import('./features/students/StudentClassDetail'), 'StudentClassDetail');

// ================= NEW FEATURES (PHASE 2 & 3) =================
const NotificationPage = load(import('./features/notifications/NotificationPage'), 'NotificationPage');
const AttendancePage = load(import('./features/attendance/AttendancePage'), 'AttendancePage');
const TimetablePage = load(import('./features/schedule/TimetablePage'), 'TimetablePage');
const StudentInvoicePage = load(import('./features/finance/StudentInvoicePage'), 'StudentInvoicePage');
const PromotionWizard = load(import('./features/people/promotion/PromotionWizard'), 'PromotionWizard');

/**
 * Loading Screen Component
 * Shown during lazy-loaded component resolution
 */
const LoadingScreen = () => (
  <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 gap-4">
    <div className="relative">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200" />
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent absolute top-0" />
    </div>
    <p className="text-sm text-slate-500 animate-pulse">Loading...</p>
  </div>
);

/**
 * Main Application Component
 * Implements role-based routing with protected routes
 */
function App() {
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <Router>
        <ErrorBoundary>
          <Toaster position="top-right" richColors closeButton />
          <Suspense fallback={<LoadingScreen />}>
            <Routes>
              {/* ================= PUBLIC ROUTES ================= */}
              <Route path="/login" element={<LoginForm />} />

              {/* Quiz player - accessible by students */}
              <Route path="/quiz/:quizId" element={<QuizPlayer />} />

              {/* ================= ADMIN ROUTES ================= */}
              {/* Protected for ADMIN and SUPER_ADMIN only */}
              <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']} />}>
                <Route element={<DashboardLayout />}>
                  <Route path="/dashboard" element={<Dashboard />} />

                  {/* Students Management */}
                  <Route path="/students" element={<StudentManager />} />
                  <Route path="/students/new" element={<AddStudent />} />
                  <Route path="/students/enroll" element={<EnrollStudent />} />
                  <Route path="/students/:studentId/ledger" element={<StudentLedger />} />

                  {/* Teachers Management */}
                  <Route path="/teachers" element={<FacultyManager />} />
                  <Route path="/teachers/new" element={<AddTeacher />} />

                  {/* Parents Management */}
                  <Route path="/parents" element={<ParentList />} />

                  {/* Classes Management */}
                  <Route path="/classes" element={<ClassList />} />
                  <Route path="/classes/new" element={<AddClass />} />
                  <Route path="/classes/:classId/grading" element={<Gradebook />} />
                  <Route path="/promote" element={<PromotionWizard />} />

                  {/* Finance */}
                  <Route path="/finance" element={<FeeList />} />

                  {/* New Features */}
                  <Route path="/attendance" element={<AttendancePage />} />
                  <Route path="/timetable" element={<TimetablePage />} />

                  {/* Settings */}
                  <Route path="/settings" element={<Settings />} />
                </Route>
              </Route>

              {/* ================= STUDENT PORTAL ================= */}
              <Route element={<ProtectedRoute allowedRoles={['STUDENT']} />}>
                <Route path="/student" element={<StudentLayout />}>
                  <Route path="dashboard" element={<StudentDashboard />} />
                  <Route path="grades" element={<StudentGrades />} />
                  <Route path="classes" element={<StudentClasses />} />
                  <Route path="class/:classId" element={<StudentClassDetail />} />
                  <Route path="timetable" element={<TimetablePage />} />
                  <Route path="finance" element={<StudentInvoicePage />} />
                </Route>
              </Route>

              {/* ================= SHARED NOTIFICATIONS ================= */}
              <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN', 'TEACHER', 'STUDENT', 'PARENT']} />}>
                <Route element={<DashboardLayout />}>
                  <Route path="/notifications" element={<NotificationPage />} />
                </Route>
              </Route>

              {/* ================= TEACHER PORTAL ================= */}
              <Route element={<ProtectedRoute allowedRoles={['TEACHER']} />}>
                <Route path="/teacher" element={<TeacherLayout />}>
                  <Route path="dashboard" element={<TeacherDashboard />} />
                  <Route path="classes" element={<TeacherClasses />} />
                  <Route path="grades" element={<TeacherGradebook />} />
                  <Route path="grading/:classId" element={<Gradebook />} />
                  <Route path="class/:classId/quiz/new" element={<QuizBuilder />} />
                  <Route path="attendance" element={<AttendancePage />} />
                  <Route path="timetable" element={<TimetablePage />} />
                </Route>
              </Route>

              {/* ================= PARENT PORTAL ================= */}
              <Route element={<ProtectedRoute allowedRoles={['PARENT']} />}>
                <Route path="/parent" element={<ParentLayout />}>
                  <Route path="dashboard" element={<ParentDashboard />} />
                  <Route path="finance" element={<StudentInvoicePage />} />
                </Route>
              </Route>

              {/* ================= FALLBACK ROUTES ================= */}
              {/* Root redirect */}
              <Route path="/" element={<Navigate to="/login" replace />} />

              {/* 404 - Not Found */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </Router>
    </ThemeProvider>
  );
}

/**
 * 404 Not Found Page
 */
const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-slate-300">404</h1>
        <p className="text-xl text-slate-600 mt-4">Page not found</p>
        <a
          href="/login"
          className="inline-block mt-6 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
        >
          Go to Login
        </a>
      </div>
    </div>
  );
};

export default App;