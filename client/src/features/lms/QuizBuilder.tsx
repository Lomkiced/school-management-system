// FILE: client/src/features/lms/QuizBuilder.tsx
import { Plus, Save, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import api from '../../lib/axios';

// --- TYPES ---
interface Option {
  id: number; // Temporary ID for UI handling
  text: string;
  isCorrect: boolean;
}

interface Question {
  id: number;
  text: string;
  points: number;
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'IDENTIFICATION';
  options: Option[];
}

export const QuizBuilder = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // --- FORM STATE ---
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState(60);
  const [questions, setQuestions] = useState<Question[]>([
    { 
      id: Date.now(), 
      text: '', 
      points: 5, 
      type: 'MULTIPLE_CHOICE', 
      options: [
        { id: 1, text: '', isCorrect: true },
        { id: 2, text: '', isCorrect: false }
      ] 
    }
  ]);

  // --- HANDLERS (The Complex Logic) ---

  const addQuestion = () => {
    setQuestions([
      ...questions, 
      { 
        id: Date.now(), 
        text: '', 
        points: 5, 
        type: 'MULTIPLE_CHOICE', 
        options: [{ id: 1, text: '', isCorrect: true }, { id: 2, text: '', isCorrect: false }] 
      }
    ]);
  };

  const removeQuestion = (qId: number) => {
    setQuestions(questions.filter(q => q.id !== qId));
  };

  const updateQuestion = (qId: number, field: keyof Question, value: any) => {
    setQuestions(questions.map(q => q.id === qId ? { ...q, [field]: value } : q));
  };

  const updateOption = (qId: number, optId: number, text: string) => {
    setQuestions(questions.map(q => {
      if (q.id !== qId) return q;
      return {
        ...q,
        options: q.options.map(o => o.id === optId ? { ...o, text } : o)
      };
    }));
  };

  const setCorrectOption = (qId: number, optId: number) => {
    setQuestions(questions.map(q => {
      if (q.id !== qId) return q;
      return {
        ...q,
        options: q.options.map(o => ({ ...o, isCorrect: o.id === optId }))
      };
    }));
  };

  const addOption = (qId: number) => {
    setQuestions(questions.map(q => {
      if (q.id !== qId) return q;
      return {
        ...q,
        options: [...q.options, { id: Date.now(), text: '', isCorrect: false }]
      };
    }));
  };

  const removeOption = (qId: number, optId: number) => {
    setQuestions(questions.map(q => {
      if (q.id !== qId) return q;
      return { ...q, options: q.options.filter(o => o.id !== optId) };
    }));
  };

  const handleSave = async () => {
    if (!title) return toast.error("Quiz Title is required");
    if (questions.some(q => !q.text)) return toast.error("All questions must have text");

    setLoading(true);
    try {
      await api.post(`/lms/class/${classId}/quizzes`, {
        title,
        description,
        duration: Number(duration),
        passingScore: 50, // Default to 50%
        questions: questions.map(q => ({
          text: q.text,
          points: Number(q.points),
          type: q.type,
          options: q.options.map(o => ({ text: o.text, isCorrect: o.isCorrect }))
        }))
      });
      
      toast.success("Quiz Published Successfully!");
      navigate(`/teacher/grading/${classId}`); // Go back to Gradebook
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to save quiz");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      
      {/* HEADER */}
      <div className="flex justify-between items-center border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Quiz Builder</h1>
          <p className="text-slate-500">Design a new assessment for your class</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
          <Button onClick={handleSave} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">
            <Save className="mr-2 h-4 w-4" /> {loading ? 'Publishing...' : 'Publish Quiz'}
          </Button>
        </div>
      </div>

      {/* SETTINGS CARD */}
      <Card>
        <CardHeader>
          <CardTitle>Quiz Settings</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Quiz Title</label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Midterm Exam" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Time Limit (Minutes)</label>
            <Input type="number" value={duration} onChange={e => setDuration(Number(e.target.value))} />
          </div>
          <div className="col-span-2 space-y-2">
            <label className="text-sm font-medium">Description (Optional)</label>
            <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Instructions for students..." />
          </div>
        </CardContent>
      </Card>

      {/* QUESTIONS LIST */}
      <div className="space-y-6">
        {questions.map((q, idx) => (
          <Card key={q.id} className="border-l-4 border-l-indigo-500 relative">
            <button 
              onClick={() => removeQuestion(q.id)}
              className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors"
            >
              <Trash2 className="h-5 w-5" />
            </button>

            <CardContent className="pt-6 space-y-6">
              <div className="flex gap-4">
                <div className="bg-indigo-100 text-indigo-700 h-8 w-8 rounded-full flex items-center justify-center font-bold shrink-0">
                  {idx + 1}
                </div>
                <div className="flex-1 space-y-4">
                  <div className="flex gap-4">
                    <Input 
                      value={q.text} 
                      onChange={e => updateQuestion(q.id, 'text', e.target.value)} 
                      placeholder="Enter question text here..." 
                      className="text-lg font-medium"
                    />
                    <Input 
                      type="number" 
                      value={q.points} 
                      onChange={e => updateQuestion(q.id, 'points', e.target.value)} 
                      className="w-24 text-center"
                      placeholder="Pts"
                    />
                  </div>

                  {/* OPTIONS EDITOR */}
                  <div className="pl-2 space-y-3">
                    {q.options.map((opt) => (
                      <div key={opt.id} className="flex items-center gap-3">
                        <div 
                          onClick={() => setCorrectOption(q.id, opt.id)}
                          className={`h-5 w-5 rounded-full border-2 cursor-pointer flex items-center justify-center ${
                            opt.isCorrect ? 'border-green-500 bg-green-500' : 'border-slate-300'
                          }`}
                        >
                          {opt.isCorrect && <div className="h-2 w-2 bg-white rounded-full" />}
                        </div>
                        <Input 
                          value={opt.text} 
                          onChange={e => updateOption(q.id, opt.id, e.target.value)}
                          placeholder={`Option text...`}
                          className={opt.isCorrect ? 'border-green-200 bg-green-50/50' : ''}
                        />
                        <button onClick={() => removeOption(q.id, opt.id)} className="text-slate-300 hover:text-red-400">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <Button variant="ghost" size="sm" onClick={() => addOption(q.id)} className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 pl-0">
                      <Plus className="h-4 w-4 mr-1" /> Add Option
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-center pt-4">
        <Button onClick={addQuestion} variant="outline" size="lg" className="w-full border-dashed border-2 hover:border-indigo-500 hover:text-indigo-600">
          <Plus className="mr-2 h-5 w-5" /> Add New Question
        </Button>
      </div>

    </div>
  );
};