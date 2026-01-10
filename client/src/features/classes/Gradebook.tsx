// FILE: client/src/features/classes/Gradebook.tsx
import { ArrowLeft, Plus } from 'lucide-react'; // <--- Added 'Plus'
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import api from '../../lib/axios';
import { useAuthStore } from '../../store/authStore';
import { ChatRoom } from '../chat/ChatRoom';

export const Gradebook = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Load Gradebook
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get(`/grading/${classId}`);
        setData(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (classId) fetchData();
  }, [classId]);

  // Save Grade
  const handleGradeChange = async (studentId: string, termId: number, score: string) => {
    if (score) {
      try {
        await api.post('/grading', { studentId, classId, termId, score });
        toast.success("Grade Saved");
      } catch (err) {
        toast.error("Save Failed");
      }
    }
    // Optimistic Update
    setData((prev: any) => {
      const newGrades = [...prev.grades];
      const existingIndex = newGrades.findIndex(g => g.studentId === studentId && g.termId === termId);
      
      if (existingIndex >= 0) {
        newGrades[existingIndex].score = parseFloat(score);
      } else {
        newGrades.push({ studentId, termId, classId: parseInt(classId!), score: parseFloat(score) });
      }
      
      return { ...prev, grades: newGrades };
    });
  };

  const calculateFinal = (studentId: string) => {
    const studentGrades = data?.grades.filter((g: any) => g.studentId === studentId && g.score > 0);
    
    if (!studentGrades || studentGrades.length === 0) return '--';

    const total = studentGrades.reduce((sum: number, g: any) => sum + g.score, 0);
    return (total / studentGrades.length).toFixed(0);
  };

  const getScore = (studentId: string, termId: number) => {
    const g = data?.grades.find((g: any) => g.studentId === studentId && g.termId === termId);
    return g ? g.score : '';
  };

  if (loading) return <div className="p-8">Loading Gradebook...</div>;
  if (!data) return <div className="p-8">Class not found.</div>;

  const { classInfo, students, terms } = data;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-100px)]">
      
      {/* LEFT: GRADEBOOK TABLE (Takes up 2/3 space) */}
      <div className="lg:col-span-2 space-y-6 overflow-y-auto">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight">Gradebook: {classInfo.subject.code}</h2>
            <p className="text-slate-500">{classInfo.section.name} • {classInfo.subject.name}</p>
          </div>
          
          <div className="flex gap-2">
            {/* === NEW: CREATE QUIZ BUTTON (Only for Teachers) === */}
            {user?.role === 'TEACHER' && (
              <Button onClick={() => navigate(`/teacher/class/${classId}/quiz/new`)} className="bg-indigo-600 hover:bg-indigo-700">
                <Plus className="mr-2 h-4 w-4" /> Create Quiz
              </Button>
            )}
            
            <Button variant="outline" onClick={() => navigate(user?.role === 'TEACHER' ? '/teacher/dashboard' : '/classes')}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Student Name</TableHead>
                  {terms.map((term: any) => (
                    <TableHead key={term.id} className="text-center">{term.name}</TableHead>
                  ))}
                  <TableHead className="text-center font-bold text-blue-600">Final</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student: any) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium text-xs">{student.lastName}, {student.firstName}</TableCell>
                    
                    {terms.map((term: any) => (
                      <TableCell key={term.id} className="p-1">
                        <Input 
                          className="w-14 mx-auto text-center h-8 text-xs" 
                          defaultValue={getScore(student.id, term.id)}
                          onBlur={(e) => handleGradeChange(student.id, term.id, e.target.value)}
                        />
                      </TableCell>
                    ))}
                    
                    <TableCell className="text-center font-bold text-blue-600">
                      {calculateFinal(student.id)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* RIGHT: REAL-TIME CHAT (Takes up 1/3 space) */}
      <div className="h-full">
         <ChatRoom classId={parseInt(classId!)} />
      </div>
    </div>
  );
};