import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import api from '../../lib/axios';

// Define what our fetched data looks like
interface OptionData {
  teachers: { id: string; firstName: string; lastName: string }[];
  subjects: { id: number; name: string; code: string }[];
  sections: { id: number; name: string }[];
}

export const AddClass = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true); // Loading state for dropdowns
  const [options, setOptions] = useState<OptionData>({ teachers: [], subjects: [], sections: [] });
  const [error, setError] = useState('');

  // The actual data we will send to the backend
  const [formData, setFormData] = useState({
    teacherId: '',
    subjectId: '',
    sectionId: ''
  });

  // 1. Fetch the Dropdown Data on Load
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const response = await api.get('/classes/options');
        setOptions(response.data.data);
      } catch (err) {
        console.error("Failed to load options", err);
        setError("Could not load form data. Please refresh.");
      } finally {
        setIsFetching(false);
      }
    };
    fetchOptions();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Basic validation
    if (!formData.teacherId || !formData.subjectId || !formData.sectionId) {
      setError("Please select all fields.");
      setIsLoading(false);
      return;
    }

    try {
      await api.post('/classes', formData);
      navigate('/classes');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to assign class');
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) return <div className="p-8 text-center">Loading school data...</div>;

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <Button variant="ghost" onClick={() => navigate('/classes')} className="gap-2">
        <ArrowLeft size={16} /> Back to Schedule
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Assign New Class</CardTitle>
          <p className="text-sm text-slate-500">Link a Subject and Section to a Teacher.</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">{error}</div>}

            {/* Subject Dropdown */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Subject</label>
              <select
                name="subjectId"
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950"
                onChange={handleChange}
                value={formData.subjectId}
              >
                <option value="">-- Select Subject --</option>
                {options.subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code} - {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Section Dropdown */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Section</label>
              <select
                name="sectionId"
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950"
                onChange={handleChange}
                value={formData.sectionId}
              >
                <option value="">-- Select Section --</option>
                {options.sections.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Teacher Dropdown */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Teacher</label>
              <select
                name="teacherId"
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950"
                onChange={handleChange}
                value={formData.teacherId}
              >
                <option value="">-- Assign Teacher --</option>
                {options.teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.lastName}, {t.firstName}
                  </option>
                ))}
              </select>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Assigning...' : 'Create Class Schedule'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};