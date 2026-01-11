// FILE: client/src/features/lms/QuizPlayer.tsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import api from "../../lib/axios";

// Define component
const QuizPlayer = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const res = await api.get(`/lms/quizzes/${quizId}`);
        setQuiz(res.data.data);
      } catch (error) {
        toast.error("Failed to load quiz");
      } finally {
        setLoading(false);
      }
    };
    if (quizId) fetchQuiz();
  }, [quizId]);

  if (loading) return <div className="p-8 text-center">Loading Quiz...</div>;
  if (!quiz) return <div className="p-8 text-center">Quiz not found.</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-8 flex items-center justify-center">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle>{quiz.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-600 mb-6">{quiz.description}</p>
          <div className="space-y-4">
            {/* Placeholder for questions */}
            <div className="p-4 border rounded-lg bg-slate-100 text-center text-slate-500">
              Quiz Player Interface Loaded Successfully
            </div>
            <Button onClick={() => navigate(-1)} variant="outline">Exit Quiz</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// === CRITICAL FIX: EXPORT DEFAULT ===
export default QuizPlayer;