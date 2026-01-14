// FILE: client/src/features/students/StudentDashboard.tsx
// 2026 Standard: Student dashboard with live API data and quick LMS access

import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  GraduationCap,
  Loader2,
  Play,
  TrendingUp,
  Trophy
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

  if (loading) {
    return (
      <div className="h-[calc(100vh-200px)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
          <p className="text-slate-500">Loading your dashboard...</p>
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
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Welcome back, {data?.studentInfo?.name?.split(' ')[0] || 'Student'}! 👋
          </h1>
          <p className="text-slate-500 mt-1">Here's your learning overview</p>
        </div>
        <Button onClick={() => navigate('/student/classes')} className="bg-indigo-600 hover:bg-indigo-700">
          <BookOpen className="h-4 w-4 mr-2" />
          My Classes
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white border-none shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-indigo-100">Enrolled Classes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold">{data?.stats?.totalClasses || 0}</span>
              <span className="mb-1 text-sm text-indigo-200">active</span>
            </div>
            <div className="mt-2 flex items-center text-xs text-indigo-100">
              <GraduationCap className="mr-1 h-3 w-3" /> Current semester
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Average Grade</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold text-slate-900">
                {data?.stats?.averageGrade || 'N/A'}
              </span>
              {data?.stats?.averageGrade && <span className="mb-1 text-sm text-slate-500">%</span>}
            </div>
            <div className="mt-2 flex items-center text-xs text-green-600">
              <TrendingUp className="mr-1 h-3 w-3" /> Keep it up!
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Grades Received</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold text-slate-900">{data?.stats?.recentGrades || 0}</span>
            </div>
            <div className="mt-2 flex items-center text-xs text-indigo-600">
              <CheckCircle2 className="mr-1 h-3 w-3" /> This term
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card
          className="cursor-pointer hover:shadow-lg transition-all hover:border-indigo-300 group"
          onClick={() => navigate('/student/classes')}
        >
          <CardContent className="pt-6 text-center">
            <div className="bg-indigo-100 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-indigo-200 transition-colors">
              <BookOpen className="h-6 w-6 text-indigo-600" />
            </div>
            <h3 className="font-semibold text-slate-900">My Classes</h3>
            <p className="text-sm text-slate-500 mt-1">View materials & quizzes</p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg transition-all hover:border-emerald-300 group"
          onClick={() => navigate('/student/grades')}
        >
          <CardContent className="pt-6 text-center">
            <div className="bg-emerald-100 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-emerald-200 transition-colors">
              <Trophy className="h-6 w-6 text-emerald-600" />
            </div>
            <h3 className="font-semibold text-slate-900">My Grades</h3>
            <p className="text-sm text-slate-500 mt-1">View your report card</p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg transition-all hover:border-amber-300 group"
          onClick={() => navigate('/student/classes')}
        >
          <CardContent className="pt-6 text-center">
            <div className="bg-amber-100 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-amber-200 transition-colors">
              <ClipboardList className="h-6 w-6 text-amber-600" />
            </div>
            <h3 className="font-semibold text-slate-900">Assignments</h3>
            <p className="text-sm text-slate-500 mt-1">Submit your work</p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg transition-all hover:border-purple-300 group"
          onClick={() => navigate('/student/classes')}
        >
          <CardContent className="pt-6 text-center">
            <div className="bg-purple-100 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-purple-200 transition-colors">
              <Play className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-slate-900">Quizzes</h3>
            <p className="text-sm text-slate-500 mt-1">Take your quizzes</p>
          </CardContent>
        </Card>
      </div>

      {/* Enrolled Classes Preview */}
      <Card className="shadow-lg">
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
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {data.enrollments.slice(0, 3).map((enrollment: any) => (
                <div
                  key={enrollment.id}
                  onClick={() => navigate(`/student/class/${enrollment.class.id}`)}
                  className="p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {enrollment.class.name}
                      </h4>
                      <p className="text-sm text-slate-500 mt-1">
                        {enrollment.class.subject?.name || 'No subject'}
                      </p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-indigo-600 transition-colors" />
                  </div>
                  {enrollment.class.teacher && (
                    <p className="text-xs text-slate-400 mt-3">
                      Teacher: {enrollment.class.teacher.firstName} {enrollment.class.teacher.lastName}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CalendarDays className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="font-medium text-slate-700">No Classes Yet</h3>
              <p className="text-sm text-slate-500 mt-1">You're not enrolled in any classes</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Grades */}
      {data?.recentGrades && data.recentGrades.length > 0 && (
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-600" />
              Recent Grades
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/student/grades')}>
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.recentGrades.slice(0, 5).map((grade: any) => (
                <div
                  key={grade.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <div>
                    <h4 className="font-medium text-slate-900">{grade.class?.name || 'Class'}</h4>
                    <p className="text-sm text-slate-500">{grade.term?.name || 'Term'}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-bold text-indigo-600">{grade.score}%</span>
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