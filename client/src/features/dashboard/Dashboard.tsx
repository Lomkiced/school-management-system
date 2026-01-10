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
  <Card className="border-l-4" style={{ borderLeftColor: color }}>
    <CardContent className="p-6">
      <div className="flex items-center justify-between space-y-0 pb-2">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <div className={`p-2 rounded-full bg-slate-100`}>
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
  // Initialize with null, but we handle it safely below
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const res = await api.get('/analytics');
      setStats(res.data.data || res.data);
    } catch (error) {
      console.error("Dashboard error:", error);
      // Set empty stats on error to prevent white screen
      setStats({}); 
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

  // SAFE DEFAULTS (Prevent White Screen)
  const safeStats = stats || {};
  const counts = safeStats.counts || { students: 0, teachers: 0, classes: 0 };
  const financials = safeStats.financials || { revenue: 0, pending: 0, history: [] };
  const demographics = safeStats.demographics || [];
  const activity = safeStats.activity || [];

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
          value={counts.students} 
          icon={Users} 
          trend="up" 
          trendValue="Active"
          color="#2563eb"
        />
        <StatCard 
          title="Total Teachers" 
          value={counts.teachers} 
          icon={UserCheck} 
          trend="up" 
          trendValue="Active"
          color="#16a34a" 
        />
        <StatCard 
          title="Active Sections" 
          value={counts.classes} 
          icon={BookOpen} 
          trend="down" 
          trendValue="Current Term"
          color="#ea580c" 
        />
        <StatCard 
          title="Total Revenue" 
          value={formatMoney(financials.revenue)} 
          icon={DollarSign} 
          trend="up" 
          trendValue="YTD"
          color="#9333ea" 
        />
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        <div className="md:col-span-4">
           {/* CRITICAL FIX: Passing safe objects guaranteed not to be null */}
           <DashboardCharts 
             financials={financials} 
             demographics={demographics} 
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
            {activity.length === 0 ? (
              <p className="text-center text-slate-400 py-8">No recent activity</p>
            ) : (
              <div className="space-y-6">
                {activity.slice(0, 5).map((item: any, i: number) => (
                  <div key={i} className="flex gap-4 relative">
                    {i !== activity.length - 1 && (
                      <div className="absolute left-[11px] top-8 bottom-[-24px] w-0.5 bg-slate-200"></div>
                    )}
                    <div className="relative z-10 flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 ring-4 ring-white">
                      <Users className="h-3 w-3 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        New Enrollment: <span className="text-indigo-600">{item.lastName || 'Student'}, {item.firstName || ''}</span>
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