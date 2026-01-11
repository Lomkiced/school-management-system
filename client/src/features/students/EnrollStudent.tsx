// FILE: client/src/features/students/EnrollStudent.tsx
import {
  ArrowLeft,
  Check,
  ChevronsUpDown,
  Loader2,
  Search,
  Users
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import api from '../../lib/axios';

// --- Types ---
interface StudentOption {
  id: string;
  firstName: string;
  lastName: string;
  user: { email: string };
}

interface SectionOption {
  id: number;
  name: string;
  gradeLevel: { name: string };
  academicYear: { name: string };
}

export const EnrollStudent = () => {
  const navigate = useNavigate();
  
  // Data State
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [sections, setSections] = useState<SectionOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Selection State
  const [selectedSectionId, setSelectedSectionId] = useState<string>("");
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  
  // Filter State
  const [studentSearch, setStudentSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Fetch Options on Mount
  useEffect(() => {
    const init = async () => {
      try {
        const res = await api.get('/enrollments/options');
        if (res.data.success) {
          setStudents(res.data.data.students);
          setSections(res.data.data.sections);
        }
      } catch (err) {
        toast.error("Failed to load enrollment data.");
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  // 2. Selection Handlers
  const toggleStudent = (id: string) => {
    const newSet = new Set(selectedStudentIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedStudentIds(newSet);
  };

  const toggleAllFiltered = () => {
    // Only toggle the students currently visible in the search
    const visibleIds = filteredStudents.map(s => s.id);
    const allSelected = visibleIds.every(id => selectedStudentIds.has(id));
    
    const newSet = new Set(selectedStudentIds);
    if (allSelected) {
      visibleIds.forEach(id => newSet.delete(id));
    } else {
      visibleIds.forEach(id => newSet.add(id));
    }
    setSelectedStudentIds(newSet);
  };

  // 3. Submit Handler
  const handleSubmit = async () => {
    if (!selectedSectionId) return toast.error("Please select a section first.");
    if (selectedStudentIds.size === 0) return toast.error("Please select at least one student.");

    try {
      setIsSubmitting(true);
      const payload = {
        sectionId: parseInt(selectedSectionId),
        studentIds: Array.from(selectedStudentIds)
      };

      const res = await api.post('/enrollments/bulk', payload);
      
      if (res.data.success) {
        toast.success(res.data.data.message);
        setSelectedStudentIds(new Set()); // Clear selection after success
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Enrollment failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. Filtering Logic
  const filteredStudents = students.filter(s => {
    const search = studentSearch.toLowerCase();
    return (
      s.firstName.toLowerCase().includes(search) || 
      s.lastName.toLowerCase().includes(search) ||
      s.user.email.toLowerCase().includes(search)
    );
  });

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col gap-4 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/students')} className="bg-white">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Enrollment Manager</h1>
            <p className="text-slate-500 text-sm">Select a section and assign multiple students.</p>
          </div>
        </div>
        <Button 
          size="lg" 
          className="bg-indigo-600 hover:bg-indigo-700 shadow-md transition-all"
          disabled={isSubmitting || selectedStudentIds.size === 0 || !selectedSectionId}
          onClick={handleSubmit}
        >
          {isSubmitting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Check className="mr-2 h-4 w-4" />}
          Enroll {selectedStudentIds.size > 0 ? `${selectedStudentIds.size} Students` : ''}
        </Button>
      </div>

      {/* MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-full min-h-0">
        
        {/* LEFT: SECTION SELECTOR */}
        <Card className="md:col-span-4 h-full flex flex-col border-slate-200 shadow-sm bg-white overflow-hidden">
          <CardHeader className="pb-3 border-b bg-slate-50/50 py-4">
            <CardTitle className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <Users className="h-4 w-4 text-indigo-600" /> 
              1. Select Section
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-2 space-y-1">
            {isLoading ? (
               <div className="flex justify-center p-8"><Loader2 className="animate-spin text-slate-300" /></div>
            ) : sections.length === 0 ? (
               <div className="p-4 text-center text-slate-500 text-sm">No sections found.</div>
            ) : (
              sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setSelectedSectionId(section.id.toString())}
                  className={`w-full text-left px-3 py-3 rounded-md text-sm transition-all border ${
                    selectedSectionId === section.id.toString()
                      ? "bg-indigo-50 border-indigo-200 ring-1 ring-indigo-300 shadow-sm"
                      : "bg-white border-transparent hover:bg-slate-50 hover:border-slate-200"
                  }`}
                >
                  <div className={`font-semibold ${selectedSectionId === section.id.toString() ? 'text-indigo-900' : 'text-slate-900'}`}>
                    {section.gradeLevel?.name || 'Grade ?'} - {section.name}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5 font-medium">
                    {section.academicYear?.name}
                  </div>
                </button>
              ))
            )}
          </CardContent>
        </Card>

        {/* RIGHT: STUDENT SELECTOR */}
        <Card className="md:col-span-8 h-full flex flex-col border-slate-200 shadow-sm bg-white overflow-hidden">
          <CardHeader className="pb-0 border-b bg-slate-50/50 space-y-3 py-4">
             <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <ChevronsUpDown className="h-4 w-4 text-indigo-600" />
                  2. Select Students
                </CardTitle>
                <div className="bg-white px-3 py-1 rounded-full border border-slate-200 text-xs font-semibold text-slate-600 shadow-sm">
                  {selectedStudentIds.size} selected
                </div>
             </div>
             
             {/* Search Input */}
             <div className="relative pb-3">
               <Search className="absolute left-3 top-1/2 -translate-y-[calc(50%+6px)] h-4 w-4 text-slate-400" />
               <Input 
                 placeholder="Search student by name or email..." 
                 className="pl-9 bg-white border-slate-200 focus-visible:ring-indigo-500"
                 value={studentSearch}
                 onChange={(e) => setStudentSearch(e.target.value)}
               />
             </div>
          </CardHeader>
          
          <CardContent className="flex-1 overflow-y-auto p-0 relative">
            {/* Select All Bar */}
            <div className="sticky top-0 bg-white/95 backdrop-blur border-b z-10 px-4 py-2.5 flex items-center gap-3">
               <input 
                  type="checkbox" 
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                  checked={filteredStudents.length > 0 && filteredStudents.every(s => selectedStudentIds.has(s.id))}
                  onChange={toggleAllFiltered}
               />
               <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Select All ({filteredStudents.length})</span>
            </div>

            <div className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center gap-2">
                  <Search className="h-8 w-8 text-slate-300" />
                  <p className="text-slate-500 text-sm">No students found matching "{studentSearch}"</p>
                </div>
              ) : (
                filteredStudents.map(student => (
                  <div 
                    key={student.id} 
                    className={`flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer ${
                      selectedStudentIds.has(student.id) ? "bg-indigo-50/40" : ""
                    }`}
                    onClick={() => toggleStudent(student.id)}
                  >
                    <input 
                      type="checkbox" 
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4 pointer-events-none"
                      checked={selectedStudentIds.has(student.id)}
                      readOnly
                    />
                    <div>
                      <div className="text-sm font-medium text-slate-900">{student.lastName}, {student.firstName}</div>
                      <div className="text-xs text-slate-500">{student.user.email}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};