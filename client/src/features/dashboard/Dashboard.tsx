// FILE: client/src/features/dashboard/Dashboard.tsx
// 2026 Command Center Dashboard - Professional Admin Hub

import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  GraduationCap,
  LayoutGrid,
  Loader2,
  Plus,
  RefreshCw,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
  Zap
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Skeleton } from '../../components/ui/skeleton';
import api from '../../lib/axios';

// ===================== TYPES =====================
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
  trends?: {
    studentsChange: number;
    revenueChange: number;
  };
  alerts?: {
    overdueFees: number;
    absentToday: number;
    pendingApprovals: number;
  };
}

// ===================== COMPONENT =====================
export const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isError, setIsError] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadData = async (showRefresh = false) => {
    try {
      if (showRefresh) setIsRefreshing(true);
      else setIsLoading(true);
      setIsError(false);

      const res = await api.get('/analytics/stats');
      if (res.data.success) {
        // Enhance with mock trends/alerts if not provided by API
        const data = res.data.data;
        setStats({
          ...data,
          trends: data.trends || { studentsChange: 12, revenueChange: 8 },
          alerts: data.alerts || { overdueFees: 5, absentToday: 12, pendingApprovals: 3 }
        });
      }
    } catch (err) {
      console.error("Dashboard Load Failed", err);
      setIsError(true);
      toast.error("Failed to load dashboard data.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // ===================== SUB-COMPONENTS =====================

  // Metric Card with trend indicator
  const MetricCard = ({ title, value, icon: Icon, color, trend, suffix = '' }: any) => (
    <div className="group relative bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-lg hover:border-slate-300 transition-all duration-300 overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: `linear-gradient(135deg, ${color}08 0%, transparent 60%)` }} />

      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
          {isLoading ? (
            <Skeleton className="h-9 w-24" />
          ) : (
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900">{value}</span>
              <span className="text-sm text-slate-400">{suffix}</span>
            </div>
          )}
          {trend !== undefined && !isLoading && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trend >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              <TrendingUp size={12} className={trend < 0 ? 'rotate-180' : ''} />
              <span>{Math.abs(trend)}% vs last month</span>
            </div>
          )}
        </div>
        <div className="p-3 rounded-xl" style={{ backgroundColor: `${color}15` }}>
          <Icon size={24} style={{ color }} />
        </div>
      </div>
    </div>
  );

  // Quick Action Button
  const QuickAction = ({ icon: Icon, label, onClick, color }: any) => (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all duration-200 group"
    >
      <div className="p-3 rounded-full transition-colors duration-200" style={{ backgroundColor: `${color}10` }}>
        <Icon size={20} style={{ color }} className="group-hover:scale-110 transition-transform" />
      </div>
      <span className="text-xs font-medium text-slate-600 group-hover:text-slate-900">{label}</span>
    </button>
  );

  // Alert Item
  const AlertItem = ({ icon: Icon, label, count, color, urgent }: any) => (
    <div className={`flex items-center justify-between p-3 rounded-lg border ${urgent ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-200'} transition-colors`}>
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${urgent ? 'bg-rose-100' : 'bg-white'}`}>
          <Icon size={16} style={{ color }} />
        </div>
        <span className="text-sm font-medium text-slate-700">{label}</span>
      </div>
      <div className={`px-3 py-1 rounded-full text-xs font-bold ${urgent ? 'bg-rose-500 text-white' : 'bg-slate-200 text-slate-700'}`}>
        {count}
      </div>
    </div>
  );

  // ===================== ERROR STATE =====================
  if (isError) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center p-8 bg-rose-50 rounded-2xl border border-rose-200 max-w-md">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-rose-100 mb-4">
            <AlertTriangle size={32} className="text-rose-500" />
          </div>
          <h3 className="text-lg font-bold text-rose-800 mb-2">Dashboard Unavailable</h3>
          <p className="text-sm text-rose-600 mb-4">We couldn't fetch the latest stats. Please check your connection.</p>
          <button
            onClick={() => loadData()}
            className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ===================== MAIN RENDER =====================
  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
            <LayoutGrid className="text-indigo-600" />
            Command Center
          </h1>
          <p className="text-slate-500 mt-1">
            {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            <span className="mx-2">•</span>
            <span className="font-mono text-indigo-600">{currentTime.toLocaleTimeString()}</span>
          </p>
        </div>
        <button
          onClick={() => loadData(true)}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-medium transition-colors disabled:opacity-50"
        >
          <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
          {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>

      {/* METRICS GRID */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Students"
          value={stats?.counts?.students?.toLocaleString() || '0'}
          icon={GraduationCap}
          color="#4F46E5"
          trend={stats?.trends?.studentsChange}
        />
        <MetricCard
          title="Total Teachers"
          value={stats?.counts?.teachers || 0}
          icon={Users}
          color="#059669"
        />
        <MetricCard
          title="Active Classes"
          value={stats?.counts?.classes || 0}
          icon={BookOpen}
          color="#D97706"
        />
        <MetricCard
          title="Monthly Revenue"
          value={`₱${(stats?.counts?.revenue || 0).toLocaleString()}`}
          icon={Wallet}
          color="#DB2777"
          trend={stats?.trends?.revenueChange}
        />
      </div>

      {/* MAIN CONTENT GRID */}
      <div className="grid gap-6 lg:grid-cols-3">

        {/* LEFT: QUICK ACTIONS + ALERTS */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Zap size={18} className="text-amber-500" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                <QuickAction icon={UserPlus} label="Add Student" onClick={() => navigate('/students/add')} color="#4F46E5" />
                <QuickAction icon={Plus} label="Create Class" onClick={() => navigate('/classes')} color="#059669" />
                <QuickAction icon={CreditCard} label="Finances" onClick={() => navigate('/finance')} color="#DB2777" />
              </div>
            </CardContent>
          </Card>

          {/* Critical Alerts */}
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Bell size={18} className="text-rose-500" />
                Critical Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {isLoading ? (
                <>
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </>
              ) : (
                <>
                  <AlertItem
                    icon={AlertTriangle}
                    label="Overdue Fees"
                    count={stats?.alerts?.overdueFees || 0}
                    color="#EF4444"
                    urgent={(stats?.alerts?.overdueFees || 0) > 0}
                  />
                  <AlertItem
                    icon={CalendarDays}
                    label="Absent Today"
                    count={stats?.alerts?.absentToday || 0}
                    color="#F59E0B"
                    urgent={false}
                  />
                  <AlertItem
                    icon={CheckCircle2}
                    label="Pending Approvals"
                    count={stats?.alerts?.pendingApprovals || 0}
                    color="#6366F1"
                    urgent={false}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* CENTER: CHARTS AREA */}
        <Card className="lg:col-span-2 border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <BarChart3 size={18} className="text-indigo-500" />
                Financial Overview
              </span>
              <button className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium">
                View Details <ArrowRight size={12} />
              </button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-8 w-3/4" />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Revenue Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-600">Collected Revenue</span>
                    <span className="text-lg font-bold text-emerald-600">₱{(stats?.counts?.revenue || 0).toLocaleString()}</span>
                  </div>
                  <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: '75%' }}
                    />
                  </div>
                </div>

                {/* Pending Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-600">Pending Fees</span>
                    <span className="text-lg font-bold text-amber-600">₱{Math.round((stats?.counts?.revenue || 0) * 0.15).toLocaleString()}</span>
                  </div>
                  <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: '15%' }}
                    />
                  </div>
                </div>

                {/* Stats Summary */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-100">
                  <div className="text-center p-3 bg-slate-50 rounded-xl">
                    <div className="text-2xl font-bold text-slate-900">{stats?.counts?.students || 0}</div>
                    <div className="text-xs text-slate-500 font-medium">Enrolled</div>
                  </div>
                  <div className="text-center p-3 bg-emerald-50 rounded-xl">
                    <div className="text-2xl font-bold text-emerald-600">87%</div>
                    <div className="text-xs text-emerald-600 font-medium">Collection Rate</div>
                  </div>
                  <div className="text-center p-3 bg-indigo-50 rounded-xl">
                    <div className="text-2xl font-bold text-indigo-600">{stats?.counts?.classes || 0}</div>
                    <div className="text-xs text-indigo-600 font-medium">Active Classes</div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* BOTTOM: ACTIVITY FEED */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Activity size={18} className="text-purple-500" />
              Recent Activity
            </span>
            <span className="text-xs text-slate-400 font-normal">Last 24 hours</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {stats?.recentActivities?.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-8">No recent activity to display.</p>
              )}
              {stats?.recentActivities?.slice(0, 6).map((log) => (
                <div key={log.id} className="flex items-center gap-4 py-3 group hover:bg-slate-50 -mx-4 px-4 rounded-lg transition-colors">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {log.user.email.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{log.action}</p>
                    <p className="text-xs text-slate-500">{log.user.email}</p>
                  </div>
                  <div className="text-xs text-slate-400 shrink-0">
                    {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};