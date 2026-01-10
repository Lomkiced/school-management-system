import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

const COLORS = ['#4f46e5', '#ec4899', '#10b981', '#f59e0b'];

interface Props {
  financials: { revenue: number; pending: number };
  demographics: { gender: string; _count: { gender: number } }[];
}

export const DashboardCharts = ({ financials, demographics }: Props) => {
  
  // Prepare Data for Financial Bar Chart
  const financeData = [
    { name: 'Collected', amount: financials.revenue, fill: '#10b981' }, // Green
    { name: 'Pending', amount: financials.pending, fill: '#ef4444' },   // Red
  ];

  // Prepare Data for Demographic Pie Chart
  const demoData = demographics.map((d) => ({
    name: d.gender,
    value: d._count.gender
  }));

  // Formatter for Currency
  const formatMoney = (value: number) => `₱${value.toLocaleString()}`;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* 1. FINANCIAL CHART */}
      <Card>
        <CardHeader>
          <CardTitle>Financial Overview</CardTitle>
          <p className="text-sm text-slate-500">Revenue vs. Outstanding Balances</p>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={financeData} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" width={80} tick={{fontSize: 12}} />
              <Tooltip formatter={(value: number) => formatMoney(value)} cursor={{fill: 'transparent'}} />
              <Bar dataKey="amount" radius={[0, 4, 4, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 2. DEMOGRAPHIC CHART */}
      <Card>
        <CardHeader>
          <CardTitle>Student Population</CardTitle>
          <p className="text-sm text-slate-500">Gender Distribution</p>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={demoData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {demoData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};