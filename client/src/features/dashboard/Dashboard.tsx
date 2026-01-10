import { Activity, BookOpen, DollarSign, UserCheck, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Skeleton } from '../../components/ui/skeleton';
import api from '../../lib/axios';
import { DashboardCharts } from './DashboardCharts'; // Import the new Charts component

export const Dashboard = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await api.get('/analytics');
      setStats(res.data.data);
    } catch (error) {
      console.error("Failed to load dashboard", error);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // 1. LOADING STATE (With Skeletons)
  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Executive Dashboard</h1>
        {/* Stats Skeletons */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-xl border bg-card text-card-foreground shadow p-6 space-y-2">
               <div className="flex justify-between">
                 <Skeleton className="h-4 w-[100px]" />
                 <Skeleton className="h-4 w-4 rounded-full" />
               </div>
               <Skeleton className="h-8 w-[60px]" />
            </div>
          ))}
        </div>
        {/* Charts Skeletons */}
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-[300px] w-full rounded-xl" />
          <Skeleton className="h-[300px] w-full rounded-xl" />
        </div>
      </div>
    );
  }

  // 2. ERROR STATE
  if (error || !stats) {
    return (
      <div className="p-8 text-center text-red-500">
        <h2 className="text-xl font-bold">Failed to load Dashboard Data</h2>
        <p>The server encountered an error calculating analytics.</p>
      </div>
    );
  }

  // Helper for formatting currency
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Executive Dashboard</h1>
      
      {/* 3. KEY METRICS ROW */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Students</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.counts?.students || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Teachers</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.counts?.teachers || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Active Classes</CardTitle>
            <BookOpen className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.counts?.classes || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatMoney(stats.financials?.revenue || 0)}</div>
          </CardContent>
        </Card>
      </div>

      {/* 4. VISUAL ANALYTICS (New Charts Section) */}
      <DashboardCharts 
        financials={stats.financials} 
        demographics={stats.demographics} 
      />

      {/* 5. RECENT ACTIVITY TABLE */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" /> Recent Enrollments
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(!stats.activity || stats.activity.length === 0) ? (
            <p className="text-slate-500">No recent activity.</p>
          ) : (
            <div className="space-y-4">
              {stats.activity.map((student: any, i: number) => (
                <div key={i} className="flex justify-between items-center border-b pb-2 last:border-0">
                  <div>
                    <p className="font-medium">{student.lastName}, {student.firstName}</p>
                    <p className="text-xs text-slate-500">
                      Registered on {student.createdAt ? new Date(student.createdAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">New</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};