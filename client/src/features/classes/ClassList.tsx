// FILE: client/src/features/classes/ClassList.tsx
// 2026 Standard: Professional class list with proper types and enhanced UX

import { BookOpen, GraduationCap, Plus, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Skeleton } from '../../components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '../../components/ui/table';
import api from '../../lib/axios';
import type { SchoolClass } from '../../types';

export const ClassList = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setError(null);
        const response = await api.get('/classes');
        if (response.data.success) {
          setClasses(response.data.data);
        } else {
          throw new Error(response.data.message || 'Failed to fetch classes');
        }
      } catch (err: any) {
        console.error("Failed to fetch classes", err);
        setError(err.response?.data?.message || err.message || 'Failed to load classes');
      } finally {
        setIsLoading(false);
      }
    };

    fetchClasses();
  }, []);

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Academic Classes</h1>
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-red-700">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>{error}</p>
            </div>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Academic Classes</h1>
          <p className="text-slate-500 mt-1">Manage class assignments and enrollments</p>
        </div>
        <Button
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700"
          onClick={() => navigate('/classes/new')}
        >
          <Plus size={16} />
          Create Class
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-100 text-sm font-medium">Total Classes</p>
                <p className="text-3xl font-bold mt-1">{classes.length}</p>
              </div>
              <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm font-medium">With Teachers</p>
                <p className="text-3xl font-bold mt-1">
                  {classes.filter(c => c.teacher).length}
                </p>
              </div>
              <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-sm font-medium">Total Students</p>
                <p className="text-3xl font-bold mt-1">
                  {classes.reduce((acc, c) => acc + (c._count?.enrollments || 0), 0)}
                </p>
              </div>
              <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Classes Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-indigo-600" />
            Class Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          {classes.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900">No classes yet</h3>
              <p className="text-slate-500 mt-1 mb-4">Get started by creating your first class.</p>
              <Button
                onClick={() => navigate('/classes/new')}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create First Class
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50">
                  <TableHead className="font-semibold">Class Name</TableHead>
                  <TableHead className="font-semibold">Subject</TableHead>
                  <TableHead className="font-semibold">Teacher</TableHead>
                  <TableHead className="font-semibold text-center">Students</TableHead>
                  <TableHead className="text-right font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classes.map((cls) => (
                  <TableRow
                    key={cls.id}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/classes/${cls.id}/grading`)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 bg-indigo-100 rounded-lg flex items-center justify-center">
                          <BookOpen className="h-4 w-4 text-indigo-600" />
                        </div>
                        <span>{cls.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {cls.subject ? (
                        <div>
                          <span className="font-medium text-slate-900">{cls.subject.code}</span>
                          <span className="text-slate-500 ml-2">- {cls.subject.name}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">No subject</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {cls.teacher ? (
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 bg-emerald-100 rounded-full flex items-center justify-center text-xs font-medium text-emerald-700">
                            {cls.teacher.firstName[0]}{cls.teacher.lastName[0]}
                          </div>
                          <span>{cls.teacher.lastName}, {cls.teacher.firstName}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                        {cls._count?.enrollments || 0} enrolled
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/classes/${cls.id}/grading`);
                        }}
                        className="hover:bg-indigo-100 hover:text-indigo-700"
                      >
                        Open Gradebook
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ClassList;