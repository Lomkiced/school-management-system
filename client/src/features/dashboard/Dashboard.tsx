import {
  Activity, BookOpen, Calendar, DollarSign,
  TrendingDown, TrendingUp, UserCheck, Users
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Skeleton } from '../../components/ui/skeleton';
import api from '../../lib/axios';
import { DashboardCharts } from './DashboardCharts';

// --- Safe StatCard Component ---
const StatCard = ({ title, value, icon: Icon, trend, trendValue, color }: any) => (
  <Card className="border-l-4 shadow-sm" style={{ borderLeftColor: color }}>
    <CardContent className="p-6">
      <div className="flex items-center justify-between space-y-0 pb-2">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <div className={`p-2 rounded-full bg-slate-50`}>
          <Icon className="h-4 w-4" style={{ color: color }} />
        </div>
      </div>
      <div className="flex items-end justify-between mt-2">
        <div className="text-2xl font-bold">{value}</div>
        {trend && (
          <div className={`flex items-center text-xs ${trend === 'up' ? 'text-emerald-600' : 'text-rose-600'}`}>
            {trend === 'up' ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
            {trendValue}
          </div>
        )}
      </div>
    </CardContent>
  </Card>
);

export const Dashboard = () => {
  // 1. Initialize with SAFE empty defaults to prevent "Undefined" errors
  const [stats, setStats] = useState({
    counts: { students: 0, teachers: 0, classes: 0 },
    financials: { revenue: 0, pending: 0, history: [] },
    activity: [],
    demographics: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchStats = async () => {
    try {
      const res = await api.get('/analytics');
      // 2. Double check if data actually exists before setting
      if (res.data) {
        setStats({
            counts: res.data.counts || { students: 0, teachers: 0, classes: 0 },
            financials: res.data.financials || { revenue: 0, pending: 0, history: [] },
            activity: res.data.activity || [],
            demographics: res.data.demographics || []
        });
      }
    } catch (error) {
      console.error("Dashboard failed to load:", error);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const formatMoney = (amount: number) => 
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount || 0);

  if (loading) return (
    <div className="space-y-6 p-8">
      <Skeleton className="h-10 w-1/3" />
      <div className="grid gap-4 md:grid-cols-4">
         {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
      </div>
    </div>
  );

  // 3. Fallback UI if API fails completely
  if (error) return (
      <div className="p-8 text-center">
          <h2 className="text-xl font-bold text-red-600">Failed to load Dashboard Data</h2>
          <p className="text-slate-500">The server analytics endpoint is not responding.</p>
          <Button onClick={fetchStats} className="mt-4">Retry Connection</Button>
      </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Executive Overview</h1>
          <p className="text-slate-500">Real-time school performance metrics.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="bg-white">
            <Calendar className="mr-2 h-4 w-4" /> {new Date().toLocaleDateString()}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Students" 
          value={stats.counts.students} 
          icon={Users} 
          trend="up" 
          trendValue="Active"
          color="#2563eb"
        />
        <StatCard 
          title="Total Teachers" 
          value={stats.counts.teachers} 
          icon={UserCheck} 
          trend="up" 
          trendValue="Active"
          color="#16a34a" 
        />
        <StatCard 
          title="Active Sections" 
          value={stats.counts.classes} 
          icon={BookOpen} 
          trend="down" 
          trendValue="Current Term"
          color="#ea580c" 
        />
        <StatCard 
          title="Total Revenue" 
          value={formatMoney(stats.financials.revenue)} 
          icon={DollarSign} 
          trend="up" 
          trendValue="YTD"
          color="#9333ea" 
        />
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        <div className="md:col-span-4">
           {/* 4. Pass safe data to charts */}
           <DashboardCharts 
             financials={stats.financials} 
             demographics={stats.demographics} 
           />
        </div>
        
        <Card className="md:col-span-3 h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-indigo-600" /> Live Feed
            </CardTitle>
            <CardDescription>Latest system events</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.activity.length === 0 ? (
              <p className="text-center text-slate-400 py-8">No recent activity</p>
            ) : (
              <div className="space-y-6">
                {stats.activity.slice(0, 5).map((item: any, i: number) => (
                  <div key={i} className="flex gap-4 relative">
                    {i !== stats.activity.length - 1 && (
                      <div className="absolute left-[11px] top-8 bottom-[-24px] w-0.5 bg-slate-200"></div>
                    )}
                    <div className="relative z-10 flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 ring-4 ring-white">
                      <Users className="h-3 w-3 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        Activity: <span className="text-indigo-600">{item.action || 'Event'}</span>
                      </p>
                      <p className="text-xs text-slate-500">
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Just now'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};