import {
  BookOpen,
  CalendarCheck,
  CheckSquare, GraduationCap,
  Users
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Skeleton } from '../../components/ui/skeleton';
import api from '../../lib/axios';

export const TeacherDashboard = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await api.get('/teacher-portal/classes');
        // SAFEGUARD: Ensure data is always an array
        setClasses(Array.isArray(res.data?.data) ? res.data.data : []);
      } catch (err) {
        console.error(err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, []);

  if (loading) return (
    <div className="p-6 grid gap-6 md:grid-cols-3">
       {[1,2,3].map(i => <Skeleton key={i} className="h-48 rounded-xl" />)}
    </div>
  );

  if (error) return <div className="p-8 text-red-500">Failed to load classes.</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* WELCOME SECTION */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white shadow-lg">
        <h1 className="text-3xl font-bold mb-2">Welcome back, Teacher!</h1>
        <p className="text-indigo-100 opacity-90">
          You have <span className="font-bold bg-white/20 px-2 py-0.5 rounded">{classes.length} active classes</span> today. 
        </p>
        
        <div className="flex gap-3 mt-6">
          <Button variant="secondary" className="text-indigo-700 bg-white hover:bg-indigo-50 border-0">
            <CheckSquare className="mr-2 h-4 w-4" /> Take Attendance
          </Button>
          <Button variant="secondary" className="text-indigo-700 bg-white hover:bg-indigo-50 border-0">
            <CalendarCheck className="mr-2 h-4 w-4" /> View Schedule
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* LEFT: CLASS LIST */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800">
            <BookOpen className="h-5 w-5 text-indigo-600" /> My Classes
          </h2>
          
          <div className="grid gap-4 md:grid-cols-2">
            {classes.length === 0 ? (
              <p className="text-slate-500">No classes assigned yet.</p>
            ) : (
              classes.map((cls) => (
                <Card key={cls.id} className="group hover:shadow-md transition-all border-l-4 border-l-indigo-500">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        {/* SAFEGUARD: Optional chaining to prevent crash if subject is null */}
                        <CardTitle className="text-lg">{cls.subject?.code || "N/A"}</CardTitle>
                        <CardDescription>{cls.subject?.name || "Unknown Subject"}</CardDescription>
                      </div>
                      <div className="bg-indigo-50 p-2 rounded-lg group-hover:bg-indigo-100 transition-colors">
                        <GraduationCap className="h-5 w-5 text-indigo-600" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 mb-4 text-sm text-slate-600">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-slate-400" />
                        {/* SAFEGUARD: Check for section */}
                        <span>{cls.section?.name || "Unassigned"}</span>
                      </div>
                    </div>
                    
                    <Button 
                      className="w-full bg-slate-900 text-white hover:bg-indigo-600 transition-colors"
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

        {/* RIGHT: NOTIFICATIONS */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-slate-800">Pending Actions</h2>
          <Card>
            <CardContent className="p-0">
               <div className="p-4 text-slate-500 text-sm">No pending actions.</div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
};