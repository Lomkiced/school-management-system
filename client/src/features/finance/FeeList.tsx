import { DollarSign, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import api from '../../lib/axios';

export const FeeList = () => {
  const [fees, setFees] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', amount: '', description: '' });

  useEffect(() => {
    fetchFees();
  }, []);

  const fetchFees = async () => {
    const res = await api.get('/finance/structure');
    setFees(res.data.data);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/finance/structure', formData);
    setShowForm(false);
    fetchFees(); // Refresh list
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Financial Settings</h1>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          <Plus size={16} /> New Fee Type
        </Button>
      </div>

      {showForm && (
        <Card className="bg-slate-50 border-blue-200">
          <CardHeader><CardTitle className="text-base">Create Fee Structure</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="flex gap-4 items-end">
              <div className="flex-1 space-y-2">
                <label className="text-xs font-bold">Fee Name</label>
                <Input placeholder="e.g. Tuition Grade 10" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
              </div>
              <div className="w-32 space-y-2">
                <label className="text-xs font-bold">Amount (₱)</label>
                <Input type="number" placeholder="0.00" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} required />
              </div>
              <Button type="submit">Save Fee</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {fees.map((fee) => (
          <Card key={fee.id}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">
                {fee.name}
              </CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₱{fee.amount.toLocaleString()}</div>
              <p className="text-xs text-slate-400 mt-1">Standard Rate</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};