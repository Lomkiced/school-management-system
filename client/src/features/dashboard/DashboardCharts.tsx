import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

interface Financials {
  revenue: number;
  pending: number;
  history: any[];
}

interface DemographicItem {
  name: string;
  value: number;
}

interface Props {
  financials: Financials;
  demographics: DemographicItem[];
}

export const DashboardCharts = ({ financials, demographics }: Props) => {
  const revenue = financials?.revenue || 0;
  const pending = financials?.pending || 0;
  const total = revenue + pending || 1; 

  // FIX: Match the "name" property from the service (MALE/FEMALE)
  const boysData = demographics?.find((d) => d.name === 'MALE');
  const girlsData = demographics?.find((d) => d.name === 'FEMALE');

  const boys = boysData?.value || 0;
  const girls = girlsData?.value || 0;
  const totalStudents = boys + girls || 1;

  // Calculate percentages safely
  const revenuePct = Math.min((revenue / total) * 100, 100);
  const pendingPct = Math.min((pending / total) * 100, 100);
  const boysPct = Math.min((boys / totalStudents) * 100, 100);

  return (
    <div className="grid gap-6">
      
      {/* FINANCIAL HEALTH CHART */}
      <Card>
        <CardHeader>
          <CardTitle>Financial Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-medium">
                <span className="text-slate-600">Collected Revenue</span>
                <span className="text-emerald-600 font-bold">₱{revenue.toLocaleString()}</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-out" 
                  style={{ width: `${revenuePct}%` }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm font-medium">
                <span className="text-slate-600">Pending Fees</span>
                <span className="text-amber-600 font-bold">₱{pending.toLocaleString()}</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber-500 rounded-full transition-all duration-1000 ease-out" 
                  style={{ width: `${pendingPct}%` }}
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
          <div className="flex items-center gap-6 pt-2">
             {/* CSS-only Donut/Pie Chart representation */}
             <div className="relative h-32 w-32 flex items-center justify-center rounded-full bg-slate-50 border-4 border-slate-100">
                {/* Simplified visual representation using border tricks */}
                <div className="absolute inset-0 rounded-full border-4 border-indigo-500 transition-all duration-1000" 
                     style={{ clipPath: `polygon(0 0, 100% 0, 100% ${boysPct}%, 0 100%)` }}>
                </div>
                <div className="text-center z-10">
                  <span className="block text-2xl font-bold text-slate-800">{boys + girls}</span>
                  <span className="text-xs text-slate-500 uppercase tracking-wider">Total</span>
                </div>
             </div>
             
             <div className="space-y-3 flex-1">
                <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                   <div className="flex items-center gap-2">
                     <div className="h-3 w-3 rounded-full bg-indigo-500"></div>
                     <span className="text-sm font-medium text-slate-700">Boys</span>
                   </div>
                   <span className="text-sm font-bold text-slate-900">{boys}</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                   <div className="flex items-center gap-2">
                     <div className="h-3 w-3 rounded-full bg-slate-300"></div>
                     <span className="text-sm font-medium text-slate-700">Girls</span>
                   </div>
                   <span className="text-sm font-bold text-slate-900">{girls}</span>
                </div>
             </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};