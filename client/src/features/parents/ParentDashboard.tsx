// FILE: client/src/features/parents/ParentDashboard.tsx
// 2026 Standard: Comprehensive parent portal with child tracking

import {
  AlertCircle,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  GraduationCap,
  Loader2,
  TrendingUp,
  Trophy,
  User,
  Users,
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await api.get('/parent-portal/dashboard');
        if (res.data.success) {
          setDashboardData(res.data.data);
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
  const parentName = user?.name || 'Guardian';

  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* HEADER */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 rounded-2xl p-8 text-white shadow-lg">
        <h1 className="text-3xl font-bold mb-2">
          Welcome, {parentName}! 👨‍👩‍👧‍👦
        </h1>
        <p className="text-indigo-100 opacity-90">
          Track your {stats.totalChildren === 1 ? "child's" : `${stats.totalChildren} children's`} progress,
          grades, and attendance all in one place.
        </p>

        <div className="flex flex-wrap gap-6 mt-6 text-sm">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <span className="font-semibold">{stats.totalChildren}</span>
            <span className="opacity-80">{stats.totalChildren === 1 ? 'Child' : 'Children'}</span>
          </div>
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            <span className="font-semibold">{stats.totalEnrollments}</span>
            <span className="opacity-80">Classes</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            <span className="font-semibold">{stats.averageAttendance}%</span>
            <span className="opacity-80">Avg Attendance</span>
          </div>
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-indigo-500 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Children Enrolled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold text-slate-900">{stats.totalChildren}</span>
            </div>
            <div className="mt-2 flex items-center text-xs text-indigo-600">
              <Users className="mr-1 h-3 w-3" /> Active students
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Attendance Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold text-slate-900">{stats.averageAttendance}%</span>
            </div>
            <div className="mt-2 flex items-center text-xs text-emerald-600">
              <Clock className="mr-1 h-3 w-3" /> Average across all
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Recent Grades</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold text-slate-900">{stats.recentGradesAvg}</span>
              <span className="text-slate-500 text-sm">/100</span>
            </div>
            <div className="mt-2 flex items-center text-xs text-amber-600">
              <TrendingUp className="mr-1 h-3 w-3" /> Average score
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 shadow-lg bg-gradient-to-br from-purple-50 to-indigo-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">Total Classes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold text-slate-900">{stats.totalEnrollments}</span>
            </div>
            <div className="mt-2 flex items-center text-xs text-purple-600">
              <BookOpen className="mr-1 h-3 w-3" /> This semester
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CHILDREN LIST */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800">
            <GraduationCap className="h-5 w-5 text-indigo-600" /> My Children
          </h2>
        </div>

        {children.length === 0 ? (
          <Card className="border-dashed border-2">
            <CardContent className="py-12 text-center">
              <AlertCircle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-700">No Children Linked</h3>
              <p className="text-slate-500 mt-1">Contact the school administrator to link your children.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {children.map((child) => {
              const avgGrade = child.grades.length > 0
                ? Math.round(child.grades.reduce((sum: number, g: any) => sum + g.score, 0) / child.grades.length)
                : 0;

              const presentCount = child.attendance.filter((a: any) => a.status === 'PRESENT').length;
              const attendanceRate = child.attendance.length > 0
                ? Math.round((presentCount / child.attendance.length) * 100)
                : 0;

              return (
                <Card
                  key={child.id}
                  className="group hover:shadow-lg transition-all border-l-4 border-l-indigo-500 cursor-pointer"
                  onClick={() => navigate(`/parent/child/${child.id}`)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg group-hover:text-indigo-600 transition-colors flex items-center gap-2">
                          <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                            {child.firstName[0]}{child.lastName[0]}
                          </div>
                          {child.firstName} {child.lastName}
                        </CardTitle>
                        <p className="text-sm text-slate-500 mt-1">{child.user.email}</p>
                      </div>
                      <div className={cn(
                        "px-2 py-1 rounded-full text-xs font-semibold",
                        child.user.isActive
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-red-50 text-red-700 border border-red-200"
                      )}>
                        {child.user.isActive ? 'Active' : 'Inactive'}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 mb-3">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-indigo-600">{child._count.enrollments}</div>
                        <div className="text-xs text-slate-500">Classes</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-emerald-600">{attendanceRate}%</div>
                        <div className="text-xs text-slate-500">Attendance</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-amber-600">{avgGrade}</div>
                        <div className="text-xs text-slate-500">Avg Grade</div>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      className="w-full text-indigo-600 hover:bg-indigo-50 group-hover:bg-indigo-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/parent/child/${child.id}`);
                      }}
                    >
                      View Details <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ParentDashboard;