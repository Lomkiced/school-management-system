// FILE: client/src/features/dashboard/Dashboard.tsx
import {
  Activity,
  BarChart3,
  Users,
  Wallet
} from 'lucide-react'; // Ensure you have these icons
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Skeleton } from '../../components/ui/skeleton';
import api from '../../lib/axios';
import { DashboardCharts } from './DashboardCharts'; // Assuming you have this

interface DashboardStats {
  counts: {
    students: number;
    teachers: number;
    classes: number;
    revenue: number;
  };
  recentActivities: {
    id: number;
    action: string;
    details: string;
    createdAt: string;
    user: { email: string };
  }[];
}

export const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setIsError(false);
        const res = await api.get('/analytics/stats');
        if (res.data.success) {
          setStats(res.data.data);
        }
      } catch (err) {
        console.error("Dashboard Load Failed", err);
        setIsError(true);
        toast.error("Failed to load dashboard data. Please try refreshing.");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // SAFE RENDER: Stat Card Component
  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <Card className="border-l-4" style={{ borderLeftColor: color }}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <div className="text-2xl font-bold" style={{ color }}>{value}</div>
        )}
      </CardContent>
    </Card>
  );

  if (isError) {
    return (
      <div className="p-8 text-center text-red-500 bg-red-50 rounded-lg border border-red-100">
        <h3 className="font-bold">Dashboard Unavailable</h3>
        <p className="text-sm">We couldn't fetch the latest stats. Check your internet connection or server status.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
      
      {/* 1. STATS GRID */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Students" 
          value={stats?.counts?.students || 0} 
          icon={Users} 
          color="#4F46E5" // Indigo
        />
        <StatCard 
          title="Total Teachers" 
          value={stats?.counts?.teachers || 0} 
          icon={Activity} 
          color="#059669" // Emerald
        />
        <StatCard 
          title="Active Classes" 
          value={stats?.counts?.classes || 0} 
          icon={BarChart3} 
          color="#D97706" // Amber
        />
        <StatCard 
          title="Monthly Revenue" 
          value={`$${(stats?.counts?.revenue || 0).toLocaleString()}`} 
          icon={Wallet} 
          color="#DB2777" // Pink
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* 2. CHARTS AREA */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Financial Overview</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <DashboardCharts /> 
          </CardContent>
        </Card>

        {/* 3. RECENT ACTIVITY */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : (
              <div className="space-y-4">
                {stats?.recentActivities?.length === 0 && <p className="text-sm text-slate-500">No recent activity.</p>}
                
                {stats?.recentActivities?.map((log) => (
                  <div key={log.id} className="flex items-center">
                    <div className="ml-4 space-y-1">
                      <p className="text-sm font-medium leading-none text-slate-900">{log.action}</p>
                      <p className="text-xs text-slate-500">
                        {log.user.email} • {new Date(log.createdAt).toLocaleTimeString()}
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