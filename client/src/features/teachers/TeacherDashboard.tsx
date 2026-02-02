// FILE: client/src/features/teachers/TeacherDashboard.tsx
// 2026 Standard: Advanced Teacher Dashboard with Workload Analytics

import {
  AlertCircle,
  ArrowRight,
  Award,
  BarChart3,
  BookOpen,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  CheckSquare,
  Clock,
  ClipboardList,
  FileText,
  GraduationCap,
  Loader2,
  PenTool,
  TrendingUp,
  Users,
  X,
  Zap
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import api from '../../lib/axios';
import { useAuthStore } from '../../store/authStore';

interface TeacherClass {
  id: string;
  name: string;
  subject?: {
    id: string;
    name: string;
    code: string;
  } | null;
  _count?: {
    enrollments: number;
  };
  avgGrade?: number; // Enhanced field
}

export const TeacherDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [stats, setStats] = useState({ totalStudents: 0 });
  const [currentTime, setCurrentTime] = useState(new Date());

  // Mock data (would come from API in production)
  const pendingSubmissions = 8;
  const pendingGrades = 12;
  const upcomingSchedule = [
    { id: 1, className: 'Grade 7 - Rizal', time: '8:00 AM', room: 'Room 201' },
    { id: 2, className: 'Grade 8 - Bonifacio', time: '9:30 AM', room: 'Room 305' },
    { id: 3, className: 'Grade 9 - Luna', time: '11:00 AM', room: 'Lab 1' },
  ];
  const topPerformers = [
    { id: 1, name: 'Juan Dela Cruz', score: 98, class: 'Grade 7' },
    { id: 2, name: 'Maria Santos', score: 96, class: 'Grade 8' },
    { id: 3, name: 'Pedro Reyes', score: 94, class: 'Grade 7' },
  ];

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await api.get('/teacher-portal/classes');
        const data = Array.isArray(res.data?.data) ? res.data.data : [];

        // Enhance with mock average grades for heatmap
        const enhanced = data.map((cls: TeacherClass, i: number) => ({
          ...cls,
          avgGrade: 70 + Math.floor(Math.random() * 25) // Mock: 70-95
        }));

        setClasses(enhanced);

        const total = data.reduce((sum: number, cls: TeacherClass) => {
          return sum + (cls._count?.enrollments || 0);
        }, 0);
        setStats({ totalStudents: total });
      } catch (err) {
        console.error(err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, []);

  // Get color based on grade
  const getGradeColor = (grade: number) => {
    if (grade >= 90) return { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-300' };
    if (grade >= 80) return { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' };
    if (grade >= 70) return { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300' };
    return { bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-300' };
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-200px)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
          <p className="text-slate-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-20">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6 text-center">
            <X className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-900">Failed to load dashboard</h3>
            <Button className="mt-4" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const teacherName = user?.email?.split('@')[0]?.split('.')[0] || 'Teacher';

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* WELCOME HEADER */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 p-6 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-indigo-200 text-sm font-medium mb-1">Welcome back</p>
            <h1 className="text-3xl font-bold tracking-tight">
              {teacherName.charAt(0).toUpperCase() + teacherName.slice(1)}! 👋
            </h1>
            <p className="text-indigo-200 mt-2 flex items-center gap-2">
              <CalendarDays size={16} />
              {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              <span className="mx-1">•</span>
              <span className="font-mono">{currentTime.toLocaleTimeString()}</span>
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              className="bg-white text-indigo-600 hover:bg-indigo-50 shadow-lg"
              onClick={() => navigate('/teacher/classes')}
            >
              <BookOpen className="mr-2 h-4 w-4" /> My Classes
            </Button>
            <Button
              className="bg-white/20 text-white hover:bg-white/30 border border-white/30"
              onClick={() => navigate('/teacher/grades')}
            >
              <ClipboardList className="mr-2 h-4 w-4" /> Gradebook
            </Button>
          </div>
        </div>
      </div>

      {/* STATS ROW */}
      <div className="grid gap-4 md:grid-cols-4">
        {/* Classes */}
        <Card className="border-slate-200">
          <CardContent className="pt-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-indigo-100">
                <BookOpen className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <span className="text-3xl font-bold text-slate-900">{classes.length}</span>
                <p className="text-sm text-slate-500">Active Classes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Students */}
        <Card className="border-slate-200">
          <CardContent className="pt-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-emerald-100">
                <Users className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <span className="text-3xl font-bold text-slate-900">{stats.totalStudents}</span>
                <p className="text-sm text-slate-500">Total Students</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pending Submissions */}
        <Card className="border-slate-200">
          <CardContent className="pt-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-amber-100">
                <FileText className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <span className="text-3xl font-bold text-slate-900">{pendingSubmissions}</span>
                <p className="text-sm text-slate-500">Pending Reviews</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pending Grades */}
        <Card className="border-slate-200">
          <CardContent className="pt-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-rose-100">
                <PenTool className="h-6 w-6 text-rose-600" />
              </div>
              <div>
                <span className="text-3xl font-bold text-slate-900">{pendingGrades}</span>
                <p className="text-sm text-slate-500">Grades to Enter</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* MAIN CONTENT GRID */}
      <div className="grid gap-6 lg:grid-cols-3">

        {/* LEFT: Schedule & Top Performers */}
        <div className="space-y-6">
          {/* Today's Schedule */}
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock size={18} className="text-indigo-500" />
                Today's Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {upcomingSchedule.map((item, idx) => (
                <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center font-bold text-indigo-600">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 truncate">{item.className}</p>
                    <p className="text-xs text-slate-500 flex items-center gap-2">
                      <Clock size={10} /> {item.time}
                      <span>•</span>
                      {item.room}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Top Performers */}
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Award size={18} className="text-amber-500" />
                Top Performers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {topPerformers.map((student, idx) => (
                <div key={student.id} className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-amber-50 to-white border border-amber-100">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${idx === 0 ? 'bg-amber-500' : idx === 1 ? 'bg-slate-400' : 'bg-amber-700'}`}>
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 truncate">{student.name}</p>
                    <p className="text-xs text-slate-500">{student.class}</p>
                  </div>
                  <div className="text-lg font-bold text-emerald-600">{student.score}%</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* CENTER & RIGHT: Class Performance Heatmap */}
        <Card className="lg:col-span-2 border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <BarChart3 size={18} className="text-purple-500" />
                Class Performance Overview
              </span>
              <Button variant="ghost" size="sm" onClick={() => navigate('/teacher/grades')}>
                Gradebook <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </CardTitle>
            <CardDescription>Average grades across your classes (color-coded)</CardDescription>
          </CardHeader>
          <CardContent>
            {classes.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 className="font-medium text-slate-700">No Classes Assigned</h3>
                <p className="text-sm text-slate-500 mt-1">Contact admin to get assigned</p>
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {classes.slice(0, 6).map((cls) => {
                  const colors = getGradeColor(cls.avgGrade || 0);
                  return (
                    <div
                      key={cls.id}
                      onClick={() => navigate(`/teacher/grading/${cls.id}`)}
                      className={`p-4 rounded-xl border-2 ${colors.bg} ${colors.border} cursor-pointer hover:shadow-lg transition-all group`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                            {cls.name}
                          </h4>
                          <p className="text-xs text-slate-600 mt-1">
                            {cls.subject?.name || 'No subject'} • {cls._count?.enrollments || 0} students
                          </p>
                        </div>
                        <div className={`text-2xl font-bold ${colors.text}`}>
                          {cls.avgGrade}%
                        </div>
                      </div>
                      <div className="mt-3 h-2 bg-white/50 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${colors.text.replace('text-', 'bg-').replace('-700', '-500')} rounded-full transition-all`}
                          style={{ width: `${cls.avgGrade}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Legend */}
            <div className="flex items-center justify-center gap-4 mt-6 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-1 text-xs">
                <div className="w-3 h-3 rounded bg-emerald-500" />
                <span className="text-slate-600">Excellent (90%+)</span>
              </div>
              <div className="flex items-center gap-1 text-xs">
                <div className="w-3 h-3 rounded bg-blue-500" />
                <span className="text-slate-600">Good (80-89%)</span>
              </div>
              <div className="flex items-center gap-1 text-xs">
                <div className="w-3 h-3 rounded bg-amber-500" />
                <span className="text-slate-600">Fair (70-79%)</span>
              </div>
              <div className="flex items-center gap-1 text-xs">
                <div className="w-3 h-3 rounded bg-rose-500" />
                <span className="text-slate-600">Needs Attention (&lt;70%)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* QUICK ACTIONS ROW */}
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Zap size={18} className="text-amber-500" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button
              onClick={() => navigate('/teacher/grades')}
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 transition-all group"
            >
              <div className="p-3 rounded-full bg-indigo-100 group-hover:bg-indigo-200 transition-colors">
                <CheckSquare size={20} className="text-indigo-600" />
              </div>
              <span className="text-sm font-medium text-slate-700 group-hover:text-indigo-700">Enter Grades</span>
            </button>

            <button
              onClick={() => navigate('/teacher/classes')}
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 transition-all group"
            >
              <div className="p-3 rounded-full bg-emerald-100 group-hover:bg-emerald-200 transition-colors">
                <CalendarCheck size={20} className="text-emerald-600" />
              </div>
              <span className="text-sm font-medium text-slate-700 group-hover:text-emerald-700">Take Attendance</span>
            </button>

            <button
              onClick={() => navigate('/lms/quizzes')}
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-slate-50 hover:bg-purple-50 border border-slate-200 hover:border-purple-200 transition-all group"
            >
              <div className="p-3 rounded-full bg-purple-100 group-hover:bg-purple-200 transition-colors">
                <FileText size={20} className="text-purple-600" />
              </div>
              <span className="text-sm font-medium text-slate-700 group-hover:text-purple-700">Create Quiz</span>
            </button>

            <button
              onClick={() => navigate('/chat')}
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-200 transition-all group"
            >
              <div className="p-3 rounded-full bg-amber-100 group-hover:bg-amber-200 transition-colors">
                <AlertCircle size={20} className="text-amber-600" />
              </div>
              <span className="text-sm font-medium text-slate-700 group-hover:text-amber-700">Announcements</span>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherDashboard;