import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

export const DashboardCharts = ({ financials, demographics }: any) => {
  // Safe defaults inside the component as a double-check
  const revenue = financials?.revenue || 0;
  const pending = financials?.pending || 0;
  const total = revenue + pending || 1; // Prevent divide by zero

  // Simple calculation for gender bars
  const boys = demographics?.find((d: any) => d.gender === 'MALE')?._count || 0;
  const girls = demographics?.find((d: any) => d.gender === 'FEMALE')?._count || 0;
  const totalStudents = boys + girls || 1;

  return (
    <div className="grid gap-6">
      
      {/* FINANCIAL HEALTH CHART */}
      <Card>
        <CardHeader>
          <CardTitle>Financial Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Custom Progress Bar for Revenue */}
            <div className="space-y-1">
              <div className="flex justify-between text-sm font-medium">
                <span>Collected Revenue</span>
                <span className="text-emerald-600">₱{revenue.toLocaleString()}</span>
              </div>
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 rounded-full transition-all duration-1000" 
                  style={{ width: `${Math.min((revenue / total) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Custom Progress Bar for Pending */}
            <div className="space-y-1">
              <div className="flex justify-between text-sm font-medium">
                <span>Pending Fees</span>
                <span className="text-amber-600">₱{pending.toLocaleString()}</span>
              </div>
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber-500 rounded-full transition-all duration-1000" 
                  style={{ width: `${Math.min((pending / total) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* DEMOGRAPHICS CHART */}
      <Card>
        <CardHeader>
          <CardTitle>Student Demographics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 pt-4">
             {/* Circular CSS Chart */}
             <div className="relative h-32 w-32 flex items-center justify-center rounded-full border-8 border-slate-100">
                <div className="absolute inset-0 rounded-full border-8 border-indigo-500" 
                     style={{ clipPath: `polygon(0 0, 100% 0, 100% ${Math.min((boys / totalStudents) * 100, 100)}%, 0 100%)` }}>
                </div>
                <div className="text-center">
                  <span className="block text-2xl font-bold">{boys + girls}</span>
                  <span className="text-xs text-slate-500">Students</span>
                </div>
             </div>
             
             <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                   <div className="h-3 w-3 rounded-full bg-indigo-500"></div>
                   <span className="text-sm text-slate-600">Boys ({boys})</span>
                </div>
                <div className="flex items-center gap-2">
                   <div className="h-3 w-3 rounded-full bg-slate-200"></div>
                   <span className="text-sm text-slate-600">Girls ({girls})</span>
                </div>
             </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};