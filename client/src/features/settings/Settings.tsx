import { useEffect, useState } from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import api from '../../lib/axios';

// Note: If you don't have Tabs UI components, we'll use simple state buttons.
// Let's use simple state to avoid complexity.

export const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [logs, setLogs] = useState<any[]>([]);
  const [password, setPassword] = useState('');
  
  useEffect(() => {
    if (activeTab === 'logs') fetchLogs();
  }, [activeTab]);

  const fetchLogs = async () => {
    const res = await api.get('/settings/logs');
    setLogs(res.data.data);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/settings/password', { newPassword: password });
      alert("Password updated successfully");
      setPassword('');
    } catch (err) {
      alert("Failed to update password");
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">System Settings</h1>

      <div className="flex gap-4 border-b">
        <button 
          className={`pb-2 px-4 font-medium ${activeTab === 'profile' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500'}`}
          onClick={() => setActiveTab('profile')}
        >
          Security Profile
        </button>
        <button 
          className={`pb-2 px-4 font-medium ${activeTab === 'logs' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500'}`}
          onClick={() => setActiveTab('logs')}
        >
          Audit Logs
        </button>
      </div>

      {activeTab === 'profile' && (
        <Card className="max-w-md">
          <CardHeader><CardTitle>Change Password</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">New Password</label>
                <Input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="Enter new secure password"
                  required
                />
              </div>
              <Button type="submit">Update Password</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {activeTab === 'logs' && (
        <Card>
          <CardHeader><CardTitle>System Activity Trail</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center">No activity recorded.</TableCell></TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs text-slate-500">
                        {new Date(log.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="font-medium">{log.user.email}</TableCell>
                      <TableCell>
                        <span className="px-2 py-1 bg-slate-100 rounded text-xs font-bold">{log.action}</span>
                      </TableCell>
                      <TableCell className="text-sm">{log.details}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};