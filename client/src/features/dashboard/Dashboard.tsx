import {
  Activity, BookOpen, Calendar, DollarSign,
  UserCheck, Users
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Skeleton } from '../../components/ui/skeleton';
import api from '../../lib/axios';
import { DashboardCharts } from './DashboardCharts';

// --- Types for Type Safety ---
interface DashboardStats {
  counts: {
    students: number;
    teachers: number;
    classes: number;
  };
  financials: {
    revenue: number;
    pending: number;
    history: any[];
  };
  activity: Array<{
    action: string;
    createdAt: string;
    user?: string;
    details?: string;
  }>;
  demographics: Array<{
    name: string;
    value: number;
  }>;
}

const StatCard = ({ title, value, icon: Icon, color }: any) => (
  <Card className="relative overflow-hidden border-none shadow-md hover:shadow-xl transition-all duration-300 group">
    {/* Gradient Background Effect */}
    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 rounded-full bg-gradient-to-br from-white/0 to-current opacity-10 group-hover:scale-150 transition-transform duration-500" style={{ color }} />
    
    <CardContent className="p-6 relative z-10">
      <div className="flex items-center justify-between pb-2">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <div className="p-2.5 rounded-xl bg-slate-50 group-hover:bg-white group-hover:shadow-sm transition-all">
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
      </div>
      <div className="flex items-end justify-between mt-4">
        <div className="text-3xl font-bold text-slate-800 tracking-tight">{value}</div>
      </div>
      {/* Decorative Line */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-30" style={{ color }} />
    </CardContent>
  </Card>
);

export const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    counts: { students: 0, teachers: 0, classes: 0 },
    financials: { revenue: 0, pending: 0, history: [] },
    activity: [],
    demographics: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await api.get('/analytics');
        if (res.data?.success && res.data?.data) {
          setStats(res.data.data);
        } else if (res.data) {
           // Handle case where data is returned directly or in a different structure
           setStats(prev => ({ ...prev, ...(res.data || {}) }));
        }
      } catch (err) {
        console.error("Dashboard Load Failed:", err);
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
      <div className="flex justify-between">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
      </div>
      <div className="grid gap-6 md:grid-cols-7">
        <Skeleton className="md:col-span-4 h-96 rounded-xl" />
        <Skeleton className="md:col-span-3 h-96 rounded-xl" />
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Executive Overview</h1>
          <p className="text-slate-500 mt-1">Real-time school performance metrics & analytics.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="bg-white hover:bg-slate-50">
            <Calendar className="mr-2 h-4 w-4 text-slate-500" /> 
            {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </Button>
        </div>
      </div>

      {/* KEY METRICS */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Students" value={stats.counts.students} icon={Users} color="#2563eb" />
        <StatCard title="Total Teachers" value={stats.counts.teachers} icon={UserCheck} color="#16a34a" />
        <StatCard title="Active Classes" value={stats.counts.classes} icon={BookOpen} color="#ea580c" />
        <StatCard title="Total Revenue" value={formatMoney(stats.financials.revenue)} icon={DollarSign} color="#9333ea" />
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        {/* CHARTS SECTION */}
        <div className="md:col-span-4">
          <DashboardCharts 
             financials={stats.financials} 
             demographics={stats.demographics} 
          />
        </div>

        {/* ACTIVITY LOG SECTION */}
        <Card className="md:col-span-3 h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-indigo-600" /> Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!stats.activity?.length ? (
              <div className="text-center py-8 text-slate-500">
                <p>No recent activity logged.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {stats.activity.slice(0, 5).map((item, i) => (
                  <div key={i} className="flex gap-4 relative">
                    {/* Activity Timeline Line */}
                    {i !== stats.activity.length - 1 && (
                      <div className="absolute left-[11px] top-6 bottom-[-24px] w-0.5 bg-slate-100"></div>
                    )}
                    
                    <div className="relative z-10 h-6 w-6 rounded-full bg-indigo-50 border-2 border-indigo-100 flex items-center justify-center shrink-0">
                      <div className="h-2 w-2 rounded-full bg-indigo-500"></div>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-slate-800 leading-none">{item.action}</p>
                      <p className="text-xs text-slate-500">
                        {item.user} • {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                      {item.details && (
                        <p className="text-xs text-slate-400 italic mt-1">"{item.details}"</p>
                      )}
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