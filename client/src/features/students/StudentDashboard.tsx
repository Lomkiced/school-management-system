import {
    AlertCircle,
    CalendarDays,
    CheckCircle2,
    TrendingUp,
    Trophy
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

// Mock Data (Replace with API call to /portal/student/me later)
const MOCK_DATA = {
  gpa: 3.8,
  attendance: "94%",
  feesDue: 5000,
  upcoming: [
    { subject: "Mathematics", task: "Midterm Exam", date: "Oct 24" },
    { subject: "Science", task: "Lab Report", date: "Oct 26" },
  ],
  grades: [
    { subject: "Math", score: 92, grade: "A" },
    { subject: "Science", score: 88, grade: "B+" },
    { subject: "History", score: 95, grade: "A" },
  ]
};

export const StudentDashboard = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      <h1 className="text-3xl font-bold tracking-tight">My Portal</h1>

      {/* STATS OVERVIEW */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-indigo-600 text-white border-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-indigo-100">Current GPA</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold">{MOCK_DATA.gpa}</span>
              <span className="mb-1 text-sm text-indigo-200">/ 4.0</span>
            </div>
            <div className="mt-2 flex items-center text-xs text-indigo-100">
               <TrendingUp className="mr-1 h-3 w-3" /> Top 10% of class
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Attendance Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold text-slate-900">{MOCK_DATA.attendance}</span>
            </div>
            <div className="mt-2 flex items-center text-xs text-green-600">
               <CheckCircle2 className="mr-1 h-3 w-3" /> Good Standing
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Outstanding Fees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold text-slate-900">₱{MOCK_DATA.feesDue.toLocaleString()}</span>
            </div>
            <div className="mt-2 flex items-center text-xs text-orange-600">
               <AlertCircle className="mr-1 h-3 w-3" /> Due by Month End
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        
        {/* GRADES TABLE */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
               <Trophy className="h-5 w-5 text-indigo-600" /> Recent Grades
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {MOCK_DATA.grades.map((g, i) => (
                <div key={i} className="flex justify-between items-center border-b pb-2 last:border-0">
                   <span className="font-medium">{g.subject}</span>
                   <div className="flex items-center gap-3">
                      <span className="text-slate-500 text-sm">{g.score}%</span>
                      <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-bold text-sm">{g.grade}</span>
                   </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4">View All Grades</Button>
          </CardContent>
        </Card>

        {/* UPCOMING EVENTS */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
               <CalendarDays className="h-5 w-5 text-orange-600" /> Upcoming Deadlines
            </CardTitle>
          </CardHeader>
          <CardContent>
             <div className="space-y-4">
               {MOCK_DATA.upcoming.map((item, i) => (
                 <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-slate-50">
                    <div className="bg-white p-2 rounded border border-slate-200 text-center min-w-[60px]">
                       <span className="block text-xs text-slate-500 uppercase">{item.date.split(' ')[0]}</span>
                       <span className="block text-lg font-bold text-slate-900">{item.date.split(' ')[1]}</span>
                    </div>
                    <div>
                       <p className="font-bold text-slate-900">{item.subject}</p>
                       <p className="text-sm text-slate-500">{item.task}</p>
                    </div>
                 </div>
               ))}
             </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};