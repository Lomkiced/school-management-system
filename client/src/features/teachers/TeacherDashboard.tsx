// FILE: client/src/features/teachers/TeacherDashboard.tsx
// 2026 Standard: Teacher dashboard with live data and quick actions

import {
  ArrowRight,
  BookOpen,
  CalendarCheck,
  CheckSquare,
  ClipboardList,
  GraduationCap,
  Loader2,
  MessageSquare,
  Users,
  X
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
}

export const TeacherDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [stats, setStats] = useState({ totalStudents: 0 });

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await api.get('/teacher-portal/classes');
        const data = Array.isArray(res.data?.data) ? res.data.data : [];
        setClasses(data);

        // Calculate total students
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
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* WELCOME SECTION */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 rounded-2xl p-8 text-white shadow-lg">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {teacherName.charAt(0).toUpperCase() + teacherName.slice(1)}! 👋
        </h1>
        <p className="text-indigo-100 opacity-90">
          You have <span className="font-bold bg-white/20 px-2 py-0.5 rounded">{classes.length} classes</span> with{' '}
          <span className="font-bold bg-white/20 px-2 py-0.5 rounded">{stats.totalStudents} students</span> total.
        </p>

        <div className="flex gap-3 mt-6">
          <Button
            variant="secondary"
            className="text-indigo-700 bg-white hover:bg-indigo-50 border-0"
            onClick={() => navigate('/teacher/classes')}
          >
            <BookOpen className="mr-2 h-4 w-4" /> My Classes
          </Button>
          <Button
            variant="secondary"
            className="text-indigo-700 bg-white hover:bg-indigo-50 border-0"
            onClick={() => navigate('/teacher/grades')}
          >
            <ClipboardList className="mr-2 h-4 w-4" /> Gradebook
          </Button>
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Classes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold text-slate-900">{classes.length}</span>
            </div>
            <div className="mt-2 flex items-center text-xs text-indigo-600">
              <BookOpen className="mr-1 h-3 w-3" /> Active this semester
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold text-slate-900">{stats.totalStudents}</span>
            </div>
            <div className="mt-2 flex items-center text-xs text-emerald-600">
              <Users className="mr-1 h-3 w-3" /> Across all classes
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg bg-gradient-to-br from-amber-50 to-orange-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-700">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Button size="sm" variant="outline" className="flex-1" onClick={() => navigate('/teacher/grades')}>
              <CheckSquare className="h-4 w-4 mr-1" />
              Grade
            </Button>
            <Button size="sm" variant="outline" className="flex-1" onClick={() => navigate('/teacher/classes')}>
              <CalendarCheck className="h-4 w-4 mr-1" />
              Manage
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* CLASS LIST */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800">
            <BookOpen className="h-5 w-5 text-indigo-600" /> My Classes
          </h2>
          <Button variant="ghost" size="sm" onClick={() => navigate('/teacher/classes')}>
            View All <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>

        {classes.length === 0 ? (
          <Card className="border-dashed border-2">
            <CardContent className="py-12 text-center">
              <BookOpen className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-700">No Classes Assigned</h3>
              <p className="text-slate-500 mt-1">Contact the administrator to get assigned to classes.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {classes.slice(0, 6).map((cls) => (
              <Card
                key={cls.id}
                className="group hover:shadow-lg transition-all border-l-4 border-l-indigo-500 cursor-pointer"
                onClick={() => navigate(`/teacher/grading/${cls.id}`)}
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg group-hover:text-indigo-600 transition-colors">
                        {cls.name}
                      </CardTitle>
                      <CardDescription>
                        {cls.subject ? (
                          <>
                            <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded mr-2">
                              {cls.subject.code}
                            </span>
                            {cls.subject.name}
                          </>
                        ) : (
                          'No subject'
                        )}
                      </CardDescription>
                    </div>
                    <div className="bg-indigo-50 p-2 rounded-lg group-hover:bg-indigo-100 transition-colors">
                      <GraduationCap className="h-5 w-5 text-indigo-600" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-sm text-slate-600">
                      <Users className="h-4 w-4 text-slate-400" />
                      <span>{cls._count?.enrollments || 0} students</span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-indigo-600 hover:bg-indigo-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/teacher/grading/${cls.id}`);
                      }}
                    >
                      <ClipboardList className="h-4 w-4 mr-1" />
                      Grade
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherDashboard;