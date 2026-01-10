import {
  Activity, BookOpen, Calendar, DollarSign,
  TrendingDown, TrendingUp, UserCheck, Users
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Skeleton } from '../../components/ui/skeleton';
import api from '../../lib/axios';
import { DashboardCharts } from './DashboardCharts';

// Safe component for displaying stats
const StatCard = ({ title, value, icon: Icon, trend, trendValue, color }: any) => (
  <Card className="border-l-4 shadow-sm" style={{ borderLeftColor: color || '#cbd5e1' }}>
    <CardContent className="p-6">
      <div className="flex items-center justify-between space-y-0 pb-2">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <div className="p-2 rounded-full bg-slate-50">
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
  // 1. Safe Default State
  const [stats, setStats] = useState({
    counts: { students: 0, teachers: 0, classes: 0 },
    financials: { revenue: 0, pending: 0, history: [] },
    activity: [],
    demographics: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await api.get('/analytics');
        // 2. Merge defaults with response to prevent undefined errors
        setStats(prev => ({ ...prev, ...(res.data || {}) }));
      } catch (err) {
        console.error("Dashboard Load Failed:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const formatMoney = (amount: number) => 
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount || 0);

  if (loading) return (
    <div className="p-8 space-y-6">
      <Skeleton className="h-10 w-48" />
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
      </div>
    </div>
  );

  // 3. Render Dashboard with whatever data we have (Safe Access)
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
        <StatCard title="Total Students" value={stats.counts?.students || 0} icon={Users} color="#2563eb" />
        <StatCard title="Total Teachers" value={stats.counts?.teachers || 0} icon={UserCheck} color="#16a34a" />
        <StatCard title="Active Sections" value={stats.counts?.classes || 0} icon={BookOpen} color="#ea580c" />
        <StatCard title="Total Revenue" value={formatMoney(stats.financials?.revenue)} icon={DollarSign} color="#9333ea" />
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        <div className="md:col-span-4">
          <DashboardCharts 
             financials={stats.financials || {}} 
             demographics={stats.demographics || []} 
          />
        </div>
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-indigo-600" /> Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!stats.activity?.length ? (
              <p className="text-sm text-slate-400">No recent activity logged.</p>
            ) : (
              <div className="space-y-4">
                {stats.activity.slice(0, 5).map((item: any, i: number) => (
                  <div key={i} className="text-sm border-l-2 border-indigo-100 pl-3 py-1">
                    <p className="font-medium text-slate-800">{item.action}</p>
                    <p className="text-xs text-slate-500">
                      {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Just now'}
                    </p>
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