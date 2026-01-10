import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import api from '../../lib/axios';

interface OptionData {
  students: { id: string; firstName: string; lastName: string }[];
  sections: { id: number; name: string; gradeLevel: { name: string } }[];
}

export const EnrollStudent = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [options, setOptions] = useState<OptionData>({ students: [], sections: [] });
  const [formData, setFormData] = useState({ studentId: '', sectionId: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const response = await api.get('/enrollments/options');
        setOptions(response.data.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchOptions();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await api.post('/enrollments', formData);
      navigate('/students'); // Go back to student list
    } catch (err: any) {
      setError(err.response?.data?.message || 'Enrollment failed');
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <Button variant="ghost" onClick={() => navigate('/students')} className="gap-2">
        <ArrowLeft size={16} /> Back to Students
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Enroll Student to Section</CardTitle>
          <p className="text-sm text-slate-500">Assign a student to a class section.</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <div className="text-red-500 text-sm">{error}</div>}

            <div className="space-y-2">
              <label className="text-sm font-medium">Select Student</label>
              <select
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                value={formData.studentId}
                onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                required
              >
                <option value="">-- Choose Student --</option>
                {options.students.map((s) => (
                  <option key={s.id} value={s.id}>{s.lastName}, {s.firstName}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Select Section</label>
              <select
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                value={formData.sectionId}
                onChange={(e) => setFormData({ ...formData, sectionId: e.target.value })}
                required
              >
                <option value="">-- Choose Section --</option>
                {options.sections.map((s) => (
                  <option key={s.id} value={s.id}>{s.gradeLevel.name} - {s.name}</option>
                ))}
              </select>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Enrolling...' : 'Confirm Enrollment'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};