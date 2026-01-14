// FILE: client/src/features/students/EnrollStudent.tsx
// 2026 Standard: Modern enrollment manager with proper API integration

import {
  ArrowLeft,
  BookOpen,
  Check,
  ChevronsUpDown,
  Filter,
  Loader2,
  Search,
  Users,
  X
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import api from '../../lib/axios';
import { cn } from '../../lib/utils';

// Types matching the actual API response
interface StudentEnrollment {
  id: string;
  classId: string;
  joinedAt: string;
  class: {
    name: string;
    subject?: {
      name: string;
    } | null;
  };
}

interface StudentOption {
  id: string;
  firstName: string;
  lastName: string;
  gender: string;
  user: {
    email: string;
    isActive: boolean;
  };
  enrollments: StudentEnrollment[];
  _count: {
    enrollments: number;
  };
}

interface ClassOption {
  id: string;
  name: string;
  teacherId?: string | null;
  teacher?: {
    firstName: string;
    lastName: string;
  } | null;
  subject?: {
    name: string;
    code: string;
  } | null;
  _count: {
    enrollments: number;
  };
}

export const EnrollStudent = () => {
  const navigate = useNavigate();

  // Data State
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selection State
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());

  // Filter State
  const [studentSearch, setStudentSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Fetch Options on Mount
  useEffect(() => {
    const init = async () => {
      try {
        setError(null);
        // FIX: Use correct API path (plural 'enrollments')
        const res = await api.get('/enrollments/options');
        if (res.data.success) {
          setStudents(res.data.data.students || []);
          setClasses(res.data.data.classes || []);
        } else {
          throw new Error(res.data.message || 'Failed to load data');
        }
      } catch (err: any) {
        console.error('Failed to load enrollment data:', err);
        const message = err.response?.data?.message || err.message || 'Failed to load enrollment data';
        setError(message);
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  // 2. Filter students not enrolled in selected class
  const availableStudents = useMemo(() => {
    if (!selectedClassId) return students;

    // Filter out students who are already enrolled in this class
    return students.filter(student => {
      const isEnrolledInClass = student.enrollments.some(
        enrollment => enrollment.classId === selectedClassId
      );
      return !isEnrolledInClass;
    });
  }, [students, selectedClassId]);

  // 3. Selection Handlers
  const toggleStudent = (id: string) => {
    const newSet = new Set(selectedStudentIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedStudentIds(newSet);
  };

  const toggleAllFiltered = () => {
    const visibleIds = filteredAndSearchedStudents.map(s => s.id);
    const allSelected = visibleIds.length > 0 && visibleIds.every(id => selectedStudentIds.has(id));

    const newSet = new Set(selectedStudentIds);
    if (allSelected) {
      visibleIds.forEach(id => newSet.delete(id));
    } else {
      visibleIds.forEach(id => newSet.add(id));
    }
    setSelectedStudentIds(newSet);
  };

  const clearSelection = () => {
    setSelectedStudentIds(new Set());
  };

  // 4. Submit Handler
  const handleSubmit = async () => {
    if (!selectedClassId) {
      toast.error("Please select a class first.");
      return;
    }
    if (selectedStudentIds.size === 0) {
      toast.error("Please select at least one student.");
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        classId: selectedClassId,
        studentIds: Array.from(selectedStudentIds)
      };

      // FIX: Use correct API path
      const res = await api.post('/enrollments/bulk', payload);

      if (res.data.success) {
        const result = res.data.data;
        toast.success(result.message || `Successfully enrolled ${result.added} students`);

        // Update local state to hide newly enrolled students immediately
        const enrolledSet = new Set(selectedStudentIds);
        setStudents(prev => prev.map(s => {
          if (enrolledSet.has(s.id)) {
            // Add the new enrollment to their list
            return {
              ...s,
              enrollments: [
                ...s.enrollments,
                {
                  id: 'temp-' + Date.now(),
                  classId: selectedClassId,
                  joinedAt: new Date().toISOString(),
                  class: classes.find(c => c.id === selectedClassId) || { name: 'Unknown' }
                }
              ],
              _count: { enrollments: s._count.enrollments + 1 }
            };
          }
          return s;
        }));

        // Update class enrollment count
        setClasses(prev => prev.map(c => {
          if (c.id === selectedClassId) {
            return {
              ...c,
              _count: { enrollments: c._count.enrollments + selectedStudentIds.size }
            };
          }
          return c;
        }));

        setSelectedStudentIds(new Set());
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Enrollment failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 5. Apply Search on top of available students
  const filteredAndSearchedStudents = useMemo(() => {
    return availableStudents.filter(s => {
      const search = studentSearch.toLowerCase();
      const fullName = `${s.firstName} ${s.lastName}`.toLowerCase();
      return fullName.includes(search) || s.user.email.toLowerCase().includes(search);
    });
  }, [availableStudents, studentSearch]);

  // Get selected class details
  const selectedClass = classes.find(c => c.id === selectedClassId);

  // Loading state
  if (isLoading) {
    return (
      <div className="h-[calc(100vh-6rem)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
          <p className="text-slate-500">Loading enrollment data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="h-[calc(100vh-6rem)] flex items-center justify-center">
        <Card className="max-w-md w-full border-red-200 bg-red-50">
          <CardContent className="pt-6 text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <X className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-red-900 mb-2">Failed to Load Data</h3>
            <p className="text-red-700 mb-4">{error}</p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => navigate(-1)}>
                Go Back
              </Button>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col gap-4 animate-in fade-in duration-500">

      {/* HEADER */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/students')} className="bg-white">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Enrollment Manager</h1>
            <p className="text-slate-500 text-sm">Select a class and enroll students.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {selectedStudentIds.size > 0 && (
            <Button variant="outline" size="sm" onClick={clearSelection}>
              <X className="h-4 w-4 mr-1" />
              Clear ({selectedStudentIds.size})
            </Button>
          )}
          <Button
            size="lg"
            className="bg-indigo-600 hover:bg-indigo-700 shadow-md transition-all"
            disabled={isSubmitting || selectedStudentIds.size === 0 || !selectedClassId}
            onClick={handleSubmit}
          >
            {isSubmitting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Check className="mr-2 h-4 w-4" />}
            Enroll {selectedStudentIds.size > 0 ? `${selectedStudentIds.size} Students` : ''}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-full min-h-0">

        {/* LEFT: CLASS SELECTOR */}
        <Card className="md:col-span-4 h-full flex flex-col border-slate-200 shadow-sm bg-white overflow-hidden">
          <CardHeader className="pb-3 border-b bg-slate-50/50 py-4">
            <CardTitle className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-indigo-600" />
              1. Select Class
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-2 space-y-1">
            {classes.length === 0 ? (
              <div className="p-4 text-center text-slate-500 text-sm">
                No classes found. Create a class first.
              </div>
            ) : (
              classes.map((cls) => (
                <button
                  key={cls.id}
                  onClick={() => {
                    setSelectedClassId(cls.id);
                    setSelectedStudentIds(new Set()); // Clear selection when changing class
                  }}
                  className={cn(
                    "w-full text-left px-3 py-3 rounded-md text-sm transition-all border group",
                    selectedClassId === cls.id
                      ? "bg-indigo-50 border-indigo-200 ring-1 ring-indigo-300 shadow-sm"
                      : "bg-white border-transparent hover:bg-slate-50 hover:border-slate-200"
                  )}
                >
                  <div className={cn(
                    "font-semibold group-hover:text-indigo-700 transition-colors flex items-center justify-between",
                    selectedClassId === cls.id ? 'text-indigo-900' : 'text-slate-900'
                  )}>
                    <span>{cls.name}</span>
                    <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full text-slate-600">
                      {cls._count.enrollments} enrolled
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5 font-medium flex items-center gap-2">
                    {cls.subject ? (
                      <>
                        <span className="font-semibold">{cls.subject.code}</span>
                        <span>-</span>
                        <span>{cls.subject.name}</span>
                      </>
                    ) : (
                      <span className="italic">No subject assigned</span>
                    )}
                  </div>
                  {cls.teacher && (
                    <div className="text-xs text-slate-400 mt-1">
                      Teacher: {cls.teacher.firstName} {cls.teacher.lastName}
                    </div>
                  )}
                </button>
              ))
            )}
          </CardContent>
        </Card>

        {/* RIGHT: STUDENT SELECTOR */}
        <Card className="md:col-span-8 h-full flex flex-col border-slate-200 shadow-sm bg-white overflow-hidden">
          <CardHeader className="pb-0 border-b bg-slate-50/50 space-y-3 py-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <ChevronsUpDown className="h-4 w-4 text-indigo-600" />
                2. Select Students
              </CardTitle>
              <div className="flex items-center gap-3">
                {/* Status Indicator */}
                <div className="text-xs text-slate-500 font-medium hidden sm:block">
                  {selectedClassId
                    ? `${filteredAndSearchedStudents.length} available`
                    : "Select a class first"}
                </div>
                <div className="bg-white px-3 py-1 rounded-full border border-slate-200 text-xs font-semibold text-slate-600 shadow-sm">
                  {selectedStudentIds.size} selected
                </div>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative pb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-[calc(50%+6px)] h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search students by name or email..."
                className="pl-9 bg-white border-slate-200 focus-visible:ring-indigo-500"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                disabled={!selectedClassId}
              />
            </div>
          </CardHeader>

          <CardContent className="flex-1 overflow-y-auto p-0 relative">
            {!selectedClassId ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8">
                <Filter className="h-12 w-12 mb-4 opacity-20" />
                <p className="font-medium">Please select a class on the left</p>
                <p className="text-xs mt-1">We will show you students not enrolled in that class.</p>
              </div>
            ) : (
              <>
                {/* Select All Header */}
                <div className="sticky top-0 bg-white/95 backdrop-blur border-b z-10 px-4 py-2.5 flex items-center gap-3">
                  <input
                    type="checkbox"
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                    checked={filteredAndSearchedStudents.length > 0 && filteredAndSearchedStudents.every(s => selectedStudentIds.has(s.id))}
                    onChange={toggleAllFiltered}
                    disabled={filteredAndSearchedStudents.length === 0}
                  />
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                    Select All ({filteredAndSearchedStudents.length})
                  </span>
                </div>

                {/* Student List */}
                <div className="divide-y divide-slate-100">
                  {filteredAndSearchedStudents.length === 0 ? (
                    <div className="p-12 text-center flex flex-col items-center gap-2">
                      <Users className="h-8 w-8 text-slate-300" />
                      <p className="text-slate-500 text-sm">
                        {studentSearch
                          ? "No matching students found."
                          : "All students are already enrolled in this class!"}
                      </p>
                    </div>
                  ) : (
                    filteredAndSearchedStudents.map(student => (
                      <div
                        key={student.id}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer",
                          selectedStudentIds.has(student.id) ? "bg-indigo-50/40" : ""
                        )}
                        onClick={() => toggleStudent(student.id)}
                      >
                        <input
                          type="checkbox"
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4 pointer-events-none"
                          checked={selectedStudentIds.has(student.id)}
                          readOnly
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-slate-900">
                            {student.lastName}, {student.firstName}
                          </div>
                          <div className="text-xs text-slate-500 truncate">{student.user.email}</div>
                        </div>
                        <div className="text-xs text-slate-400">
                          {student._count.enrollments} class{student._count.enrollments !== 1 ? 'es' : ''}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EnrollStudent;