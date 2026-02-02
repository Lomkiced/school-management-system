// FILE: client/src/features/classes/AddClass.tsx
// 2026 Standard: Modern class creation form with advanced teacher selection

import { ArrowLeft, BookOpen, Loader2, Save, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { TeacherSelector, type TeacherWithWorkload } from '../../components/teachers/TeacherSelector';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import api from '../../lib/axios';

// Types matching the actual API response
interface Subject {
  id: string;
  name: string;
  code: string;
  description?: string | null;
}

interface OptionData {
  teachers: TeacherWithWorkload[];
  subjects: Subject[];
}

interface FormData {
  name: string;
  teacherId: string;
  subjectId: string;
}

export const AddClass = () => {
  const navigate = useNavigate();

  // Loading states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  // Data
  const [options, setOptions] = useState<OptionData>({ teachers: [], subjects: [] });

  const [error, setError] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Form data - matches what the API expects
  const [formData, setFormData] = useState<FormData>({
    name: '',
    teacherId: '',
    subjectId: ''
  });

  // Fetch dropdown options on mount
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setFetchError(null);
        const response = await api.get('/classes/options/form');
        if (response.data.success) {
          setOptions(response.data.data || { teachers: [], subjects: [] });
        } else {
          throw new Error(response.data.message || 'Failed to load options');
        }
      } catch (err: any) {
        console.error("Failed to load options", err);
        const message = err.response?.data?.message || err.message || 'Could not load form data';
        setFetchError(message);
        toast.error(message);
      } finally {
        setIsFetching(false);
      }
    };
    fetchOptions();
  }, []);

  // Auto-generate class name based on subject selection
  useEffect(() => {
    if (formData.subjectId && !formData.name) {
      const subject = options.subjects.find(s => s.id === formData.subjectId);
      if (subject) {
        setFormData(prev => ({
          ...prev,
          name: `${subject.name} Class`
        }));
      }
    }
  }, [formData.subjectId, options.subjects]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  // Handle teacher selection from TeacherSelector
  const handleTeacherSelect = (teacher: TeacherWithWorkload | null) => {
    setFormData(prev => ({
      ...prev,
      teacherId: teacher?.id || ''
    }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.name.trim()) {
      setError('Please enter a class name.');
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = {
        name: formData.name.trim(),
        teacherId: formData.teacherId || undefined,
        subjectId: formData.subjectId || undefined
      };

      const response = await api.post('/classes', payload);

      if (response.data.success) {
        toast.success('Class created successfully!');
        navigate('/classes');
      } else {
        throw new Error(response.data.message || 'Failed to create class');
      }
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Failed to create class';
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fetch error state
  if (fetchError) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => navigate('/classes')} className="gap-2">
          <ArrowLeft size={16} /> Back to Classes
        </Button>

        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6 text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <X className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-red-900 mb-2">Failed to Load Form</h3>
            <p className="text-red-700 mb-4">{fetchError}</p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => navigate('/classes')}>
                Go Back
              </Button>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading state
  if (isFetching) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => navigate('/classes')} className="gap-2">
          <ArrowLeft size={16} /> Back to Classes
        </Button>

        <Card>
          <CardContent className="py-16 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-4" />
            <p className="text-slate-500">Loading form data...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500">
      <Button variant="ghost" onClick={() => navigate('/classes')} className="gap-2">
        <ArrowLeft size={16} /> Back to Classes
      </Button>

      <Card className="shadow-lg border-slate-200 overflow-hidden">
        {/* Premium Header */}
        <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
          <CardTitle className="flex items-center gap-2 text-xl">
            <div className="p-2 bg-white/20 rounded-xl">
              <BookOpen className="h-5 w-5" />
            </div>
            Create New Class
          </CardTitle>
          <p className="text-indigo-100 text-sm mt-1">
            Set up a class with intelligent teacher assignment
          </p>
        </CardHeader>

        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
                <div className="p-1.5 bg-red-100 rounded-lg">
                  <X className="h-4 w-4" />
                </div>
                {error}
              </div>
            )}

            {/* Class Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Class Name <span className="text-red-500">*</span>
              </label>
              <Input
                name="name"
                placeholder="e.g., Grade 10 Science, Algebra II"
                value={formData.name}
                onChange={handleChange}
                className="bg-white border-slate-200 focus-visible:ring-indigo-500 h-12 text-base"
              />
              <p className="text-xs text-slate-400">
                Enter a descriptive name for this class.
              </p>
            </div>

            {/* Subject Dropdown - Enhanced */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-slate-400" />
                Subject
              </label>
              <select
                name="subjectId"
                className="flex h-12 w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                onChange={handleChange}
                value={formData.subjectId}
              >
                <option value="">-- No Subject --</option>
                {options.subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code} - {s.name}
                  </option>
                ))}
              </select>
              {options.subjects.length === 0 && (
                <p className="text-xs text-amber-600">
                  No subjects available. Create subjects in Settings first.
                </p>
              )}
            </div>

            {/* Teacher Assignment - Using TeacherSelector */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Assign Teacher
              </label>
              <TeacherSelector
                teachers={options.teachers}
                selectedTeacherId={formData.teacherId || null}
                onSelect={handleTeacherSelect}
                isLoading={isFetching}
              />
              {options.teachers.length === 0 && (
                <p className="text-xs text-amber-600">
                  No teachers available. Add teachers first.
                </p>
              )}
              <p className="text-xs text-slate-400">
                Select a teacher based on availability and workload distribution.
              </p>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-12"
                onClick={() => navigate('/classes')}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-base font-medium"
                disabled={isSubmitting || !formData.name.trim()}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Create Class
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Help Text */}
      <div className="text-center text-sm text-slate-400 bg-slate-50 rounded-xl p-4">
        <p>After creating the class, you can assign students from the class details page.</p>
      </div>
    </div>
  );
};

export default AddClass;