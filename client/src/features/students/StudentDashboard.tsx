// FILE: client/src/features/students/StudentDashboard.tsx
// 2026 Standard: Advanced Student Dashboard with Progress Tracking & Gamification

import {
  AlertCircle,
  ArrowRight,
  Award,
  BookOpen,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock,
  Flame,
  GraduationCap,
  Loader2,
  Play,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  Zap
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import api from '../../lib/axios';

interface DashboardData {
  studentInfo: {
    name: string;
    email: string;
    id: string;
  };
  stats: {
    totalClasses: number;
    averageGrade: string | null;
    recentGrades: number;
  };
  enrollments: any[];
  recentGrades: any[];
}

export const StudentDashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mock enhanced data (would come from API in production)
  const attendanceStreak = 12;
  const completedAssignments = 8;
  const totalAssignments = 10;
  const upcomingDeadlines = [
    { id: 1, title: 'Math Quiz', subject: 'Mathematics', dueIn: '2 days', type: 'quiz' },
    { id: 2, title: 'Science Report', subject: 'Science', dueIn: '5 days', type: 'assignment' },
  ];

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const res = await api.get('/portal/dashboard');
        if (res.data.success) {
          setData(res.data.data);
        }
      } catch (err: any) {
        console.error('Dashboard error:', err);
        setError(err.response?.data?.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  // Calculate GPA color
  const getGradeColor = (grade: number) => {
    if (grade >= 90) return 'text-emerald-600';
    if (grade >= 80) return 'text-blue-600';
    if (grade >= 70) return 'text-amber-600';
    return 'text-rose-600';
  };

  const gradeValue = parseFloat(data?.stats?.averageGrade || '0');
  const completionPercent = Math.round((completedAssignments / totalAssignments) * 100);

  if (loading) {
    return (
      <div className="h-[calc(100vh-200px)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <Loader2 className="h-16 w-16 animate-spin text-indigo-600" />
            <Sparkles className="h-6 w-6 text-amber-400 absolute -top-1 -right-1 animate-pulse" />
          </div>
          <p className="text-slate-500 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-20">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-900">{error}</h3>
            <Button className="mt-4" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* WELCOME HEADER */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 p-6 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-indigo-200 text-sm font-medium mb-1">Welcome back</p>
            <h1 className="text-3xl font-bold tracking-tight">
              {data?.studentInfo?.name?.split(' ')[0] || 'Student'}! 👋
            </h1>
            <p className="text-indigo-200 mt-2 flex items-center gap-2">
              <CalendarCheck size={16} />
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <Button
            onClick={() => navigate('/student/classes')}
            className="bg-white text-indigo-600 hover:bg-indigo-50 shadow-lg"
          >
            <BookOpen className="h-4 w-4 mr-2" />
            My Classes
          </Button>
        </div>
      </div>

      {/* STATS ROW */}
      <div className="grid gap-4 md:grid-cols-4">
        {/* GPA Card with Ring */}
        <Card className="relative overflow-hidden border-slate-200">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-indigo-100 to-transparent rounded-bl-full" />
          <CardContent className="pt-5">
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16">
                <svg className="w-16 h-16 transform -rotate-90">
                  <circle cx="32" cy="32" r="28" stroke="#e2e8f0" strokeWidth="6" fill="none" />
                  <circle
                    cx="32" cy="32" r="28"
                    stroke="#4F46E5"
                    strokeWidth="6"
                    fill="none"
                    strokeDasharray={`${gradeValue * 1.76} 176`}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-lg font-bold ${getGradeColor(gradeValue)}`}>
                    {data?.stats?.averageGrade || 'N/A'}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">Average Grade</p>
                <div className="flex items-center gap-1 text-xs text-emerald-600 mt-1">
                  <TrendingUp size={12} />
                  <span>+3% this term</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Attendance Streak */}
        <Card className="border-slate-200">
          <CardContent className="pt-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100">
                <Flame className="h-8 w-8 text-orange-500" />
              </div>
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-slate-900">{attendanceStreak}</span>
                  <span className="text-sm text-slate-500">days</span>
                </div>
                <p className="text-sm text-slate-500">Attendance Streak 🔥</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Assignment Progress */}
        <Card className="border-slate-200">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-500 font-medium">Assignments</p>
              <span className="text-xs font-bold text-indigo-600">{completionPercent}%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-1000"
                style={{ width: `${completionPercent}%` }}
              />
            </div>
            <p className="text-xs text-slate-400 mt-2">{completedAssignments} of {totalAssignments} completed</p>
          </CardContent>
        </Card>

        {/* Classes Enrolled */}
        <Card className="border-slate-200">
          <CardContent className="pt-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-emerald-100">
                <GraduationCap className="h-8 w-8 text-emerald-600" />
              </div>
              <div>
                <span className="text-3xl font-bold text-slate-900">{data?.stats?.totalClasses || 0}</span>
                <p className="text-sm text-slate-500">Active Classes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* MAIN CONTENT */}
      <div className="grid gap-6 lg:grid-cols-3">

        {/* LEFT: Quick Actions & Deadlines */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Zap size={18} className="text-amber-500" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <button
                onClick={() => navigate('/student/classes')}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 border border-transparent transition-all group"
              >
                <div className="p-2 rounded-lg bg-indigo-100 group-hover:bg-indigo-200 transition-colors">
                  <BookOpen size={18} className="text-indigo-600" />
                </div>
                <span className="font-medium text-slate-700 group-hover:text-indigo-700">View My Classes</span>
                <ArrowRight size={16} className="ml-auto text-slate-400 group-hover:text-indigo-600" />
              </button>

              <button
                onClick={() => navigate('/student/grades')}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 border border-transparent transition-all group"
              >
                <div className="p-2 rounded-lg bg-emerald-100 group-hover:bg-emerald-200 transition-colors">
                  <Trophy size={18} className="text-emerald-600" />
                </div>
                <span className="font-medium text-slate-700 group-hover:text-emerald-700">Check My Grades</span>
                <ArrowRight size={16} className="ml-auto text-slate-400 group-hover:text-emerald-600" />
              </button>

              <button
                onClick={() => navigate('/student/classes')}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-purple-50 hover:border-purple-200 border border-transparent transition-all group"
              >
                <div className="p-2 rounded-lg bg-purple-100 group-hover:bg-purple-200 transition-colors">
                  <Play size={18} className="text-purple-600" />
                </div>
                <span className="font-medium text-slate-700 group-hover:text-purple-700">Take a Quiz</span>
                <ArrowRight size={16} className="ml-auto text-slate-400 group-hover:text-purple-600" />
              </button>
            </CardContent>
          </Card>

          {/* Upcoming Deadlines */}
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock size={18} className="text-rose-500" />
                Upcoming Deadlines
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingDeadlines.map(deadline => (
                <div key={deadline.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className={`p-2 rounded-lg ${deadline.type === 'quiz' ? 'bg-purple-100' : 'bg-amber-100'}`}>
                    {deadline.type === 'quiz' ? (
                      <Play size={16} className="text-purple-600" />
                    ) : (
                      <ClipboardList size={16} className="text-amber-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 truncate">{deadline.title}</p>
                    <p className="text-xs text-slate-500">{deadline.subject}</p>
                  </div>
                  <div className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-full">
                    {deadline.dueIn}
                  </div>
                </div>
              ))}
              {upcomingDeadlines.length === 0 && (
                <div className="text-center py-6 text-slate-500 text-sm">
                  <CheckCircle2 className="mx-auto mb-2 text-emerald-400" size={32} />
                  No upcoming deadlines!
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* CENTER: Enrolled Classes */}
        <Card className="lg:col-span-2 border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-indigo-600" />
              Your Classes
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/student/classes')}>
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {data?.enrollments && data.enrollments.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {data.enrollments.slice(0, 4).map((enrollment: any) => (
                  <div
                    key={enrollment.id}
                    onClick={() => navigate(`/student/class/${enrollment.class.id}`)}
                    className="p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-lg transition-all cursor-pointer group bg-white"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                          {enrollment.class.name}
                        </h4>
                        <p className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                          <Target size={12} />
                          {enrollment.class.subject?.name || 'No subject'}
                        </p>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-100 group-hover:bg-indigo-100 transition-colors">
                        <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                      </div>
                    </div>
                    {enrollment.class.teacher && (
                      <p className="text-xs text-slate-400 mt-3 pt-3 border-t border-slate-100">
                        👨‍🏫 {enrollment.class.teacher.firstName} {enrollment.class.teacher.lastName}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <CalendarDays className="h-16 w-16 text-slate-200 mx-auto mb-4" />
                <h3 className="font-semibold text-slate-700">No Classes Yet</h3>
                <p className="text-sm text-slate-500 mt-1">You're not enrolled in any classes</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* RECENT GRADES */}
      {data?.recentGrades && data.recentGrades.length > 0 && (
        <Card className="border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-500" />
              Recent Grades
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/student/grades')}>
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {data.recentGrades.slice(0, 6).map((grade: any) => (
                <div
                  key={grade.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-slate-50 to-white border border-slate-100 hover:border-slate-200 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <h4 className="font-medium text-slate-900 truncate">{grade.class?.name || 'Class'}</h4>
                    <p className="text-xs text-slate-500">{grade.term?.name || 'Term'}</p>
                  </div>
                  <div className={`text-2xl font-bold ${getGradeColor(grade.score)}`}>
                    {grade.score}%
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StudentDashboard;