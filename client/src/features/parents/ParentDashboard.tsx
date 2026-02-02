// FILE: client/src/features/parents/ParentDashboard.tsx
// 2026 Standard: Advanced Parent Portal with Multi-Child Management

import {
  AlertCircle,
  Award,
  Bell,
  BookOpen,
  Calendar,
  CalendarCheck,
  CheckCircle2,
  ChevronRight,
  Clock,
  CreditCard,
  Flame,
  GraduationCap,
  Heart,
  Loader2,
  TrendingUp,
  User,
  Users,
  Wallet,
  X
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import api from '../../lib/axios';
import { useAuthStore } from '../../store/authStore';
import { cn } from '../../lib/utils';

interface ChildData {
  id: string;
  firstName: string;
  lastName: string;
  gender: string;
  user: {
    email: string;
    isActive: boolean;
  };
  enrollments: any[];
  grades: any[];
  attendance: any[];
  _count: {
    enrollments: number;
    grades: number;
    attendance: number;
  };
}

interface DashboardData {
  children: ChildData[];
  stats: {
    totalChildren: number;
    totalEnrollments: number;
    averageAttendance: number;
    recentGradesAvg: number;
  };
}

export const ParentDashboard = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await api.get('/parent-portal/dashboard');
        if (res.data.success) {
          setDashboardData(res.data.data);
          // Auto-select first child
          if (res.data.data.children?.length > 0) {
            setSelectedChildId(res.data.data.children[0].id);
          }
        }
      } catch (err: any) {
        console.error('Parent dashboard error:', err);
        toast.error(err.response?.data?.message || 'Failed to load dashboard');
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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

  if (error || !dashboardData) {
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

  const { children, stats } = dashboardData;
  const parentName = user?.name || user?.email?.split('@')[0] || 'Guardian';
  const selectedChild = children.find(c => c.id === selectedChildId) || children[0];

  // Calculate child-specific stats
  const childAvgGrade = selectedChild?.grades?.length > 0
    ? Math.round(selectedChild.grades.reduce((sum: number, g: any) => sum + g.score, 0) / selectedChild.grades.length)
    : 0;

  const presentCount = selectedChild?.attendance?.filter((a: any) => a.status === 'PRESENT')?.length || 0;
  const childAttendanceRate = selectedChild?.attendance?.length > 0
    ? Math.round((presentCount / selectedChild.attendance.length) * 100)
    : 0;

  // Mock data
  const upcomingEvents = [
    { id: 1, title: 'Parent-Teacher Conference', date: 'Jan 25', type: 'meeting' },
    { id: 2, title: 'Math Quiz', date: 'Jan 28', type: 'exam' },
  ];

  const getGradeColor = (grade: number) => {
    if (grade >= 90) return 'text-emerald-600';
    if (grade >= 80) return 'text-blue-600';
    if (grade >= 70) return 'text-amber-600';
    return 'text-rose-600';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* WELCOME HEADER */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 p-6 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-purple-200 text-sm font-medium mb-1">
              <Heart size={14} className="text-pink-300" />
              Family Portal
            </div>
            <h1 className="text-3xl font-bold tracking-tight">
              Welcome, {parentName.charAt(0).toUpperCase() + parentName.slice(1)}! 👨‍👩‍👧‍👦
            </h1>
            <p className="text-purple-200 mt-2 flex items-center gap-2">
              <CalendarCheck size={16} />
              {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden md:block">
              <p className="text-sm text-purple-200">You have</p>
              <p className="text-2xl font-bold">{stats.totalChildren} {stats.totalChildren === 1 ? 'Child' : 'Children'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* CHILD SELECTOR TABS */}
      {children.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {children.map((child) => (
            <button
              key={child.id}
              onClick={() => setSelectedChildId(child.id)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all shrink-0",
                selectedChildId === child.id
                  ? "bg-indigo-50 border-indigo-500 shadow-md"
                  : "bg-white border-slate-200 hover:border-slate-300"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg",
                selectedChildId === child.id
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 text-slate-600"
              )}>
                {child.firstName[0]}
              </div>
              <div className="text-left">
                <p className={cn(
                  "font-semibold",
                  selectedChildId === child.id ? "text-indigo-700" : "text-slate-700"
                )}>
                  {child.firstName}
                </p>
                <p className="text-xs text-slate-500">{child._count.enrollments} classes</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* FAMILY OVERVIEW STATS */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-slate-200">
          <CardContent className="pt-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-indigo-100">
                <Users className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <span className="text-3xl font-bold text-slate-900">{stats.totalChildren}</span>
                <p className="text-sm text-slate-500">Children</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="pt-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-emerald-100">
                <BookOpen className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <span className="text-3xl font-bold text-slate-900">{stats.totalEnrollments}</span>
                <p className="text-sm text-slate-500">Total Classes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="pt-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-amber-100">
                <CheckCircle2 className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <span className="text-3xl font-bold text-slate-900">{stats.averageAttendance}%</span>
                <p className="text-sm text-slate-500">Avg Attendance</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="pt-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-purple-100">
                <Award className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <span className={`text-3xl font-bold ${getGradeColor(stats.recentGradesAvg)}`}>{stats.recentGradesAvg}</span>
                <p className="text-sm text-slate-500">Avg Grade</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* MAIN CONTENT GRID */}
      <div className="grid gap-6 lg:grid-cols-3">

        {/* SELECTED CHILD DETAIL */}
        {selectedChild && (
          <Card className="lg:col-span-2 border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                    {selectedChild.firstName[0]}{selectedChild.lastName[0]}
                  </div>
                  <div>
                    <span className="text-xl">{selectedChild.firstName} {selectedChild.lastName}</span>
                    <p className="text-sm text-slate-500 font-normal">{selectedChild.user.email}</p>
                  </div>
                </span>
                <Button variant="outline" size="sm" onClick={() => navigate(`/parent/child/${selectedChild.id}`)}>
                  Full Profile <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Child Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="text-3xl font-bold text-indigo-600">{selectedChild._count.enrollments}</div>
                  <div className="text-xs text-slate-500 font-medium mt-1">Enrolled Classes</div>
                </div>
                <div className="text-center p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                  <div className="flex items-center justify-center gap-1">
                    <Flame className="h-5 w-5 text-orange-500" />
                    <span className="text-3xl font-bold text-emerald-600">{childAttendanceRate}%</span>
                  </div>
                  <div className="text-xs text-slate-500 font-medium mt-1">Attendance</div>
                </div>
                <div className="text-center p-4 rounded-xl bg-amber-50 border border-amber-100">
                  <div className={`text-3xl font-bold ${getGradeColor(childAvgGrade)}`}>{childAvgGrade}</div>
                  <div className="text-xs text-slate-500 font-medium mt-1">Average Grade</div>
                </div>
              </div>

              {/* Recent Grades */}
              <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <Award size={16} className="text-amber-500" />
                Recent Grades
              </h4>
              {selectedChild.grades?.length > 0 ? (
                <div className="space-y-2">
                  {selectedChild.grades.slice(0, 4).map((grade: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                      <div>
                        <p className="font-medium text-slate-800">{grade.class?.name || 'Class'}</p>
                        <p className="text-xs text-slate-500">{grade.gradeType || 'Exam'}</p>
                      </div>
                      <div className={`text-xl font-bold ${getGradeColor(grade.score)}`}>
                        {grade.score}%
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-slate-500 text-sm bg-slate-50 rounded-lg">
                  No grades available yet
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* RIGHT SIDEBAR */}
        <div className="space-y-6">
          {/* Upcoming Events */}
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar size={18} className="text-indigo-500" />
                Upcoming Events
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {upcomingEvents.map(event => (
                <div key={event.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className={cn(
                    "p-2 rounded-lg",
                    event.type === 'meeting' ? "bg-purple-100" : "bg-amber-100"
                  )}>
                    {event.type === 'meeting' ? (
                      <Users size={16} className="text-purple-600" />
                    ) : (
                      <GraduationCap size={16} className="text-amber-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 truncate">{event.title}</p>
                    <p className="text-xs text-slate-500">{event.date}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Bell size={18} className="text-amber-500" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <button
                onClick={() => navigate('/finance')}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-100 hover:border-emerald-200 transition-all group"
              >
                <div className="p-2 rounded-lg bg-emerald-100 group-hover:bg-emerald-200 transition-colors">
                  <CreditCard size={16} className="text-emerald-600" />
                </div>
                <span className="font-medium text-slate-700 group-hover:text-emerald-700">Pay Tuition Fees</span>
                <ChevronRight size={16} className="ml-auto text-slate-400" />
              </button>

              <button
                onClick={() => navigate('/chat')}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-200 transition-all group"
              >
                <div className="p-2 rounded-lg bg-indigo-100 group-hover:bg-indigo-200 transition-colors">
                  <Users size={16} className="text-indigo-600" />
                </div>
                <span className="font-medium text-slate-700 group-hover:text-indigo-700">Message Teacher</span>
                <ChevronRight size={16} className="ml-auto text-slate-400" />
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ParentDashboard;