import { BookOpen, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import api from '../../lib/axios';

export const TeacherDashboard = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await api.get('/teacher-portal/classes');
        setClasses(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, []);

  if (loading) return <div className="p-8">Loading Schedule...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">My Class Schedule</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {classes.length === 0 ? (
          <p className="text-slate-500">No classes assigned yet.</p>
        ) : (
          classes.map((cls) => (
            <Card key={cls.id} className="hover:shadow-lg transition-shadow border-t-4 border-t-indigo-500">
              <CardHeader>
                <CardTitle className="flex justify-between items-start">
                  <div>
                    <span className="text-2xl font-bold">{cls.subject.code}</span>
                    <p className="text-sm text-slate-500 font-normal">{cls.subject.name}</p>
                  </div>
                  <BookOpen className="text-indigo-200" />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-slate-600">
                  <Users size={16} />
                  <span className="text-sm font-medium">{cls.section.name} Section</span>
                </div>
                
                <Button 
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                  onClick={() => navigate(`/teacher/grading/${cls.id}`)}
                >
                  Open Gradebook
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};