import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import api from '../../lib/axios';
import { useAuthStore } from '../../store/authStore';

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
    fetchData();
  }, [classId]);

  // Save Grade
  const handleGradeChange = async (studentId: string, termId: number, score: string) => {
    if (score) {
      try {
        await api.post('/grading', { studentId, classId, termId, score });
        // SUCCESS TOAST
        toast.success("Grade Saved", {
            description: "The grade has been recorded successfully."
        });
      } catch (err) {
        // ERROR TOAST
        toast.error("Save Failed", {
            description: "Could not save the grade. Check your connection."
        });
        return;
      }
    }

    // 2. Update Local State (Instant Feedback)
    // We clone the data to trigger a re-render with the new score
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

  const handleBack = () => {
    if (user?.role === 'TEACHER') {
      navigate('/teacher/dashboard');
    } else {
      navigate('/classes');
    }
  };

  // Helper: Find Score
  const getScore = (studentId: string, termId: number) => {
    const g = data?.grades.find((g: any) => g.studentId === studentId && g.termId === termId);
    return g ? g.score : '';
  };

  // NEW: Helper: Calculate Average
  const calculateFinal = (studentId: string) => {
    // Find all grades for this student in this class
    const studentGrades = data?.grades.filter((g: any) => g.studentId === studentId && g.score > 0);
    
    if (!studentGrades || studentGrades.length === 0) return '--';

    const total = studentGrades.reduce((sum: number, g: any) => sum + g.score, 0);
    // Running Average: Sum / Count of entered grades
    // Final Average: Sum / 4 (if you want strictly 4 quarters)
    // Let's use Running Average for now so it shows something immediately
    const average = total / studentGrades.length;
    
    return average.toFixed(0); // Round to whole number
  };

  if (loading) return <div className="p-8">Loading Gradebook...</div>;
  if (!data) return <div className="p-8">Class not found.</div>;

  const { classInfo, students, terms } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Gradebook: {classInfo.subject.code}</h2>
          <p className="text-slate-500">{classInfo.section.name} • {classInfo.subject.name}</p>
        </div>
        <Button variant="outline" onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">Student Name</TableHead>
                {terms.map((term: any) => (
                  <TableHead key={term.id} className="text-center">{term.name}</TableHead>
                ))}
                <TableHead className="text-center font-bold text-blue-600">Final Grade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student: any) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">{student.lastName}, {student.firstName}</TableCell>
                  
                  {terms.map((term: any) => (
                    <TableCell key={term.id} className="p-2">
                      <Input 
                        className="w-20 mx-auto text-center h-8" 
                        defaultValue={getScore(student.id, term.id)}
                        onBlur={(e) => handleGradeChange(student.id, term.id, e.target.value)}
                        placeholder="-"
                      />
                    </TableCell>
                  ))}
                  
                  {/* The Calculated Final Grade */}
                  <TableCell className="text-center font-bold text-blue-600 text-lg">
                    {calculateFinal(student.id)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};