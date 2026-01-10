import { ArrowLeft, CreditCard } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import api from '../../lib/axios';

export const StudentLedger = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState<any>(null);
  const [ledger, setLedger] = useState<any[]>([]);
  const [feeOptions, setFeeOptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [studentId]);

  const loadData = async () => {
    try {
      const [studentRes, ledgerRes, feesRes] = await Promise.all([
        api.get(`/students/${studentId}`),
        api.get(`/finance/ledger/${studentId}`),
        api.get('/finance/structure')
      ]);
      setStudent(studentRes.data.data);
      setLedger(ledgerRes.data.data);
      setFeeOptions(feesRes.data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const assignFee = async (feeStructureId: string) => {
    if (!feeStructureId) return;
    await api.post('/finance/assign', { studentId, feeStructureId });
    loadData(); // Refresh list
  };

  const payFee = async (studentFeeId: number, amount: number) => {
    const payAmount = prompt(`Enter payment amount (Balance: ₱${amount})`, amount.toString());
    if (!payAmount) return;
    
    await api.post('/finance/pay', { 
      studentFeeId, 
      amount: payAmount, 
      method: 'CASH', 
      transactionId: `TXN-${Date.now()}` 
    });
    loadData(); // Refresh
  };

  if (loading) return <div className="p-8">Loading Ledger...</div>;

  const totalBalance = ledger.reduce((acc, item) => acc + item.balance, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{student?.lastName}, {student?.firstName}</h1>
          <p className="text-slate-500">Student ID: {student?.id.substring(0,8)}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-500">Total Outstanding Balance</p>
          <h2 className="text-4xl font-bold text-red-600">₱{totalBalance.toLocaleString()}</h2>
        </div>
      </div>

      <div className="flex gap-4">
        <Button variant="outline" onClick={() => navigate('/students')}><ArrowLeft className="mr-2 h-4 w-4"/> Back</Button>
        
        {/* Quick Assign Dropdown */}
        <select 
          className="h-10 rounded-md border border-slate-200 px-3 py-2 text-sm bg-white"
          onChange={(e) => { assignFee(e.target.value); e.target.value = ''; }}
        >
          <option value="">+ Assign New Fee</option>
          {feeOptions.map(f => (
            <option key={f.id} value={f.id}>{f.name} (₱{f.amount})</option>
          ))}
        </select>
      </div>

      <Card>
        <CardHeader><CardTitle>Account Statement</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fee Description</TableHead>
                <TableHead>Total Cost</TableHead>
                <TableHead>Amount Paid</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ledger.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center">No financial records found.</TableCell></TableRow>
              ) : (
                ledger.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.feeStructure.name}</TableCell>
                    <TableCell>₱{item.feeStructure.amount.toLocaleString()}</TableCell>
                    <TableCell className="text-green-600">₱{item.totalPaid.toLocaleString()}</TableCell>
                    <TableCell className="text-red-600 font-bold">₱{item.balance.toLocaleString()}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${item.status === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {item.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {item.balance > 0 && (
                        <Button size="sm" onClick={() => payFee(item.id, item.balance)}>
                          <CreditCard className="mr-2 h-4 w-4" /> Pay
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};