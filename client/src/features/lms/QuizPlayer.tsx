// FILE: client/src/features/lms/QuizPlayer.tsx
import { CheckCircle, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import api from '../../lib/axios';
import { useAuthStore } from '../../store/authStore';

export const QuizPlayer = () => {
  const { quizId } = useParams();
  const { user } = useAuthStore();
  
  const [quiz, setQuiz] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  useEffect(() => {
    api.get(`/lms/quizzes/${quizId}`).then(res => {
      if(res.data.success) setQuiz(res.data.data);
    });
  }, [quizId]);

  const handleOptionSelect = (questionId: string, optionId: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: { questionId, selectedOptionId: optionId } }));
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        studentId: user?.id,
        answers: Object.values(answers)
      };
      
      const res = await api.post(`/lms/quizzes/${quizId}/submit`, payload);
      
      if (res.data.success) {
        setSubmitted(true);
        setScore(res.data.data.score);
        toast.success("Quiz Submitted Successfully!");
      }
    } catch (error) {
      toast.error("Submission Failed. Try again.");
    }
  };

  if (!quiz) return <div className="p-8 text-center">Loading Quiz...</div>;

  if (submitted) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Card className="w-96 text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle>Quiz Completed!</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-500 mb-4">Your answers have been recorded.</p>
            <div className="text-4xl font-bold text-indigo-600 mb-2">
              {score} / {quiz.questions.reduce((a:any, b:any) => a + b.points, 0)}
            </div>
            <p className="text-sm font-medium text-slate-400">FINAL SCORE</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold">{quiz.title}</h1>
          <p className="text-slate-500">{quiz.description}</p>
        </div>
        <div className="flex items-center gap-2 text-orange-600 bg-orange-50 px-3 py-1 rounded-full font-mono text-sm">
          <Clock className="h-4 w-4" />
          {quiz.duration} mins
        </div>
      </div>

      <div className="space-y-8">
        {quiz.questions.map((q: any, idx: number) => (
          <Card key={q.id}>
            <CardHeader className="bg-slate-50/50 pb-2">
              <div className="flex justify-between">
                <span className="font-bold text-slate-400">Question {idx + 1}</span>
                <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-2 py-1 rounded">
                  {q.points} PTS
                </span>
              </div>
              <p className="text-lg font-medium mt-2">{q.text}</p>
            </CardHeader>
            <CardContent className="pt-4 space-y-2">
              {q.options.map((opt: any) => (
                <div 
                  key={opt.id}
                  onClick={() => handleOptionSelect(q.id, opt.id)}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    answers[q.id]?.selectedOptionId === opt.id
                      ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600'
                      : 'hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  {opt.text}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-end pt-6 pb-20">
        <Button size="lg" className="w-48" onClick={handleSubmit}>
          Submit Quiz
        </Button>
      </div>
    </div>
  );
};