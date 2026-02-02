// FILE: client/src/features/classes/ClassList.tsx
// 2026 Standard: Professional class list with quick teacher reassignment

import { BookOpen, GraduationCap, Loader2, Plus, RefreshCw, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { TeacherSelector, type TeacherWithWorkload } from '../../components/teachers/TeacherSelector';
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
  const [teachers, setTeachers] = useState<TeacherWithWorkload[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Reassignment modal state
  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<SchoolClass | null>(null);
  const [isReassigning, setIsReassigning] = useState(false);

  // Fetch classes and teachers
  useEffect(() => {
    const fetchData = async () => {
      try {
        setError(null);
        const [classesRes, optionsRes] = await Promise.all([
          api.get('/classes'),
          api.get('/classes/options/form')
        ]);

        if (classesRes.data.success) {
          setClasses(classesRes.data.data);
        } else {
          throw new Error(classesRes.data.message || 'Failed to fetch classes');
        }

        if (optionsRes.data.success) {
          setTeachers(optionsRes.data.data.teachers || []);
        }
      } catch (err: any) {
        console.error("Failed to fetch data", err);
        setError(err.response?.data?.message || err.message || 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle teacher reassignment
  const handleReassignTeacher = async (teacher: TeacherWithWorkload | null) => {
    if (!selectedClass) return;

    setIsReassigning(true);
    try {
      const response = await api.patch(`/classes/${selectedClass.id}`, {
        teacherId: teacher?.id || null
      });

      if (response.data.success) {
        // Update local state
        setClasses(prev => prev.map(cls =>
          cls.id === selectedClass.id
            ? {
              ...cls,
              teacherId: teacher?.id || null,
              teacher: teacher ? {
                id: teacher.id,
                firstName: teacher.firstName,
                lastName: teacher.lastName,
                phone: teacher.phone
              } : null
            }
            : cls
        ));

        toast.success(
          teacher
            ? `Teacher reassigned to ${teacher.lastName}, ${teacher.firstName}`
            : 'Teacher removed from class'
        );
        setReassignModalOpen(false);
        setSelectedClass(null);
      } else {
        throw new Error(response.data.message);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to reassign teacher');
    } finally {
      setIsReassigning(false);
    }
  };

  // Open reassignment modal
  const openReassignModal = (cls: SchoolClass, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedClass(cls);
    setReassignModalOpen(true);
  };

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
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg"
          onClick={() => navigate('/classes/new')}
        >
          <Plus size={16} />
          Create Class
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-lg">
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

        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg">
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

        <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-lg">
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
      <Card className="shadow-lg">
        <CardHeader className="bg-slate-50/50 border-b">
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-indigo-600" />
            Class Schedule
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {classes.length === 0 ? (
            <div className="text-center py-12 px-6">
              <BookOpen className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900">No classes yet</h3>
              <p className="text-slate-500 mt-1 mb-4">Get started by creating your first class.</p>
              <Button
                onClick={() => navigate('/classes/new')}
                className="bg-gradient-to-r from-indigo-600 to-purple-600"
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
                        <div className="h-9 w-9 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center shadow-sm">
                          <BookOpen className="h-4 w-4 text-white" />
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
                          <div className="h-7 w-7 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-xs font-medium text-white shadow-sm">
                            {cls.teacher.firstName[0]}{cls.teacher.lastName[0]}
                          </div>
                          <div>
                            <span className="text-slate-900">{cls.teacher.lastName}, {cls.teacher.firstName}</span>
                            <button
                              onClick={(e) => openReassignModal(cls, e)}
                              className="ml-2 text-xs text-indigo-600 hover:text-indigo-800 hover:underline"
                            >
                              Change
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => openReassignModal(cls, e)}
                          className="flex items-center gap-1.5 text-amber-600 hover:text-amber-800 text-sm font-medium transition-colors"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          Assign Teacher
                        </button>
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
                        className="hover:bg-indigo-100 hover:text-indigo-700 hover:border-indigo-200"
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

      {/* Teacher Reassignment Modal */}
      {reassignModalOpen && selectedClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
              <h2 className="text-xl font-bold">Reassign Teacher</h2>
              <p className="text-indigo-100 text-sm mt-1">
                Select a new teacher for <span className="font-semibold">{selectedClass.name}</span>
              </p>
              {selectedClass.teacher && (
                <div className="mt-3 flex items-center gap-2 text-sm bg-white/10 rounded-lg px-3 py-2">
                  <span className="text-indigo-200">Current:</span>
                  <span className="font-medium">
                    {selectedClass.teacher.lastName}, {selectedClass.teacher.firstName}
                  </span>
                </div>
              )}
            </div>

            {/* Teacher Selector */}
            <div className="p-6">
              {isReassigning ? (
                <div className="text-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-4" />
                  <p className="text-slate-500">Updating teacher assignment...</p>
                </div>
              ) : (
                <TeacherSelector
                  teachers={teachers}
                  selectedTeacherId={selectedClass.teacherId || null}
                  onSelect={handleReassignTeacher}
                />
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 border-t px-6 py-4 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setReassignModalOpen(false);
                  setSelectedClass(null);
                }}
                disabled={isReassigning}
              >
                Cancel
              </Button>
              {selectedClass.teacher && (
                <Button
                  variant="outline"
                  className="text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => handleReassignTeacher(null)}
                  disabled={isReassigning}
                >
                  Remove Teacher
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassList;