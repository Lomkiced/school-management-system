// FILE: client/src/features/classes/Gradebook.tsx
// 2026 Standard: Professional gradebook with proper data handling

import { ArrowLeft, BookOpen, Loader2, Plus, Users, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import api from '../../lib/axios';
import { useAuthStore } from '../../store/authStore';
import { ChatRoom } from '../chat/ChatRoom';

// Types matching the API response
interface ClassInfo {
  id: string;
  name: string;
  teacher?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  subject?: {
    id: string;
    name: string;
    code: string;
  } | null;
  _count: {
    enrollments: number;
  };
}

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  user?: {
    email: string;
  };
}

interface Term {
  id: string;
  name: string;
}

interface Grade {
  id: string;
  studentId: string;
  termId: string;
  score: number;
  feedback?: string | null;
}

interface GradebookData {
  classInfo: ClassInfo;
  students: Student[];
  terms: Term[];
  grades: Grade[];
}

export const Gradebook = () => {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const [data, setData] = useState<GradebookData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingGrades, setSavingGrades] = useState<Set<string>>(new Set());

  // Load Gradebook
  useEffect(() => {
    const fetchData = async () => {
      if (!classId) {
        setError('No class ID provided');
        setLoading(false);
        return;
      }

      try {
        setError(null);
        const res = await api.get(`/grading/${classId}`);
        if (res.data.success) {
          setData(res.data.data);
        } else {
          throw new Error(res.data.message || 'Failed to load gradebook');
        }
      } catch (err: any) {
        console.error('Gradebook fetch error:', err);
        const message = err.response?.data?.message || err.message || 'Failed to load gradebook';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [classId]);

  // Save Grade
  const handleGradeChange = async (studentId: string, termId: string, scoreStr: string) => {
    const score = parseFloat(scoreStr);

    // Skip if empty or invalid
    if (!scoreStr || isNaN(score)) return;

    // Validate score range
    if (score < 0 || score > 100) {
      toast.error('Score must be between 0 and 100');
      return;
    }

    const gradeKey = `${studentId}-${termId}`;
    setSavingGrades(prev => new Set(prev).add(gradeKey));

    try {
      await api.post('/grading', {
        studentId,
        classId,
        termId,
        score
      });
      toast.success('Grade saved');

      // Update local state
      setData((prev) => {
        if (!prev) return prev;

        const newGrades = [...prev.grades];
        const existingIndex = newGrades.findIndex(
          g => g.studentId === studentId && g.termId === termId
        );

        if (existingIndex >= 0) {
          newGrades[existingIndex] = { ...newGrades[existingIndex], score };
        } else {
          newGrades.push({
            id: `temp-${Date.now()}`,
            studentId,
            termId,
            score
          });
        }

        return { ...prev, grades: newGrades };
      });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save grade');
    } finally {
      setSavingGrades(prev => {
        const newSet = new Set(prev);
        newSet.delete(gradeKey);
        return newSet;
      });
    }
  };

  const calculateFinal = (studentId: string): string => {
    if (!data) return '--';

    const studentGrades = data.grades.filter(
      g => g.studentId === studentId && g.score > 0
    );

    if (studentGrades.length === 0) return '--';

    const total = studentGrades.reduce((sum, g) => sum + g.score, 0);
    return (total / studentGrades.length).toFixed(0);
  };

  const getScore = (studentId: string, termId: string): string => {
    if (!data) return '';
    const grade = data.grades.find(g => g.studentId === studentId && g.termId === termId);
    return grade ? grade.score.toString() : '';
  };

  const getBackPath = () => {
    if (user?.role === 'TEACHER') return '/teacher/dashboard';
    return '/classes';
  };

  // Loading state
  if (loading) {
    return (
      <div className="h-[calc(100vh-100px)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
          <p className="text-slate-500">Loading gradebook...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <div className="max-w-md mx-auto mt-20">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6 text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <X className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-red-900 mb-2">
              {error || 'Class not found'}
            </h3>
            <p className="text-red-700 mb-4 text-sm">
              {error === 'Class not found'
                ? 'The class you are looking for does not exist or you do not have access.'
                : 'There was an error loading the gradebook.'}
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => navigate(getBackPath())}>
                <ArrowLeft className="h-4 w-4 mr-2" />
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

  const { classInfo, students, terms } = data;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-100px)] animate-in fade-in duration-500">

      {/* LEFT: GRADEBOOK TABLE (Takes up 2/3 space) */}
      <div className="lg:col-span-2 space-y-6 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-indigo-600" />
              Gradebook: {classInfo.name}
            </h2>
            <p className="text-slate-500 flex items-center gap-2">
              {classInfo.subject ? (
                <>
                  <span className="font-medium">{classInfo.subject.code}</span>
                  <span>-</span>
                  <span>{classInfo.subject.name}</span>
                </>
              ) : (
                <span className="italic">No subject assigned</span>
              )}
              {classInfo.teacher && (
                <>
                  <span className="text-slate-300 mx-2">|</span>
                  <span>Teacher: {classInfo.teacher.firstName} {classInfo.teacher.lastName}</span>
                </>
              )}
            </p>
          </div>

          <div className="flex gap-2">
            {/* Create Quiz Button (Only for Teachers) */}
            {user?.role === 'TEACHER' && (
              <Button
                onClick={() => navigate(`/teacher/class/${classId}/quiz/new`)}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus className="mr-2 h-4 w-4" /> Create Quiz
              </Button>
            )}

            <Button variant="outline" onClick={() => navigate(getBackPath())}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-4">
          <div className="bg-white border rounded-lg px-4 py-2 flex items-center gap-2">
            <Users className="h-4 w-4 text-slate-400" />
            <span className="text-sm text-slate-600">
              <strong>{students.length}</strong> students enrolled
            </span>
          </div>
          <div className="bg-white border rounded-lg px-4 py-2 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-slate-400" />
            <span className="text-sm text-slate-600">
              <strong>{terms.length}</strong> grading periods
            </span>
          </div>
        </div>

        {/* Gradebook Table */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="py-3 border-b bg-slate-50/50">
            <CardTitle className="text-sm font-medium text-slate-700">
              Enter grades for each student and term
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {students.length === 0 ? (
              <div className="py-16 text-center">
                <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900">No students enrolled</h3>
                <p className="text-slate-500 mt-1">Enroll students to start grading.</p>
                <Button
                  className="mt-4"
                  onClick={() => navigate('/students/enroll')}
                >
                  Enroll Students
                </Button>
              </div>
            ) : terms.length === 0 ? (
              <div className="py-16 text-center">
                <BookOpen className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900">No grading periods</h3>
                <p className="text-slate-500 mt-1">Create terms in Settings to enable grading.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/80">
                    <TableHead className="w-[200px] pl-4">Student Name</TableHead>
                    {terms.map((term) => (
                      <TableHead key={term.id} className="text-center w-20">
                        {term.name}
                      </TableHead>
                    ))}
                    <TableHead className="text-center font-bold text-indigo-600 w-20">
                      Final
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.id} className="hover:bg-slate-50/50">
                      <TableCell className="font-medium text-sm pl-4">
                        <div>
                          <div>{student.lastName}, {student.firstName}</div>
                          {student.user?.email && (
                            <div className="text-xs text-slate-400">{student.user.email}</div>
                          )}
                        </div>
                      </TableCell>

                      {terms.map((term) => {
                        const gradeKey = `${student.id}-${term.id}`;
                        const isSaving = savingGrades.has(gradeKey);

                        return (
                          <TableCell key={term.id} className="p-1">
                            <div className="relative">
                              <Input
                                className={`w-16 mx-auto text-center h-8 text-sm ${isSaving ? 'bg-indigo-50' : ''}`}
                                defaultValue={getScore(student.id, term.id)}
                                onBlur={(e) => handleGradeChange(student.id, term.id, e.target.value)}
                                disabled={isSaving}
                                placeholder="-"
                              />
                              {isSaving && (
                                <Loader2 className="absolute right-1 top-1/2 -translate-y-1/2 h-3 w-3 animate-spin text-indigo-600" />
                              )}
                            </div>
                          </TableCell>
                        );
                      })}

                      <TableCell className="text-center">
                        <span className={`font-bold ${parseFloat(calculateFinal(student.id)) >= 75
                            ? 'text-emerald-600'
                            : parseFloat(calculateFinal(student.id)) >= 0
                              ? 'text-amber-600'
                              : 'text-slate-400'
                          }`}>
                          {calculateFinal(student.id)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* RIGHT: REAL-TIME CHAT (Takes up 1/3 space) */}
      <div className="h-full hidden lg:block">
        <ChatRoom classId={classId!} />
      </div>
    </div>
  );
};

export default Gradebook;