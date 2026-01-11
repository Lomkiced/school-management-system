// FILE: client/src/features/students/StudentList.tsx
import {
  AlertCircle,
  ChevronLeft, ChevronRight,
  CreditCard,
  Filter,
  Loader2,
  Plus,
  Search,
  Trash2,
  Upload,
  Users
} from 'lucide-react';
import { useEffect, useState } from 'react'; // Removed useMemo (server handles filtering)
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

// UI Components
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Skeleton } from '../../components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import api from '../../lib/axios';
import { ImportStudentsModal } from './ImportStudentsModal';

// Types
interface Student {
  id: string;
  firstName: string;
  lastName: string;
  gender: string;
  user: {
    email: string;
    isActive: boolean;
  };
  enrollments: { section: { name: string } }[];
}

interface Meta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// --- Debounce Hook for Search ---
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

const Avatar = ({ name }: { name: string }) => {
  const initials = name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();
  return (
    <div className="h-9 w-9 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
      {initials}
    </div>
  );
};

const StatusBadge = ({ isActive }: { isActive: boolean }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
    isActive 
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
      : 'bg-red-50 text-red-700 border-red-200' // Changed "Inactive" to Red for clarity
  }`}>
    <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isActive ? 'bg-emerald-500' : 'bg-red-400'}`}></span>
    {isActive ? 'Active' : 'Inactive'}
  </span>
);

export const StudentList = () => {
  const navigate = useNavigate();
  
  // -- Server-Side State --
  const [students, setStudents] = useState<Student[]>([]);
  const [meta, setMeta] = useState<Meta>({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  
  // -- Filters --
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500); // Wait 500ms before API call
  const [filterStatus, setFilterStatus] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ACTIVE");
  const [currentPage, setCurrentPage] = useState(1);

  // -- Action State --
  const [isDeleting, setIsDeleting] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // 1. Fetch Data (Server-Side Logic)
  const fetchStudents = async () => {
    try {
      setIsLoading(true);
      // Query Params for API
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        search: debouncedSearch,
        status: filterStatus
      });

      const response = await api.get(`/students?${params.toString()}`);
      
      if (response.data.success) {
        setStudents(response.data.data);
        setMeta(response.data.meta);
      }
    } catch (error) {
      console.error("Failed to fetch students", error);
      toast.error("Failed to load student list.");
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger fetch when filters change
  useEffect(() => {
    fetchStudents();
    // Reset selection on page change/filter change
    setSelectedIds(new Set());
  }, [currentPage, debouncedSearch, filterStatus]);

  // Reset page to 1 if search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, filterStatus]);


  // 2. Action Handlers
  const handleDelete = async (ids: string[]) => {
    if (!window.confirm(`Are you sure you want to DEACTIVATE ${ids.length} student(s)? They will lose access.`)) return;

    try {
      setIsDeleting(true);
      await Promise.all(ids.map(id => api.delete(`/students/${id}`))); // Calls the new Deactivate route
      
      toast.success("Students deactivated successfully.");
      fetchStudents(); // Refresh list
      setSelectedIds(new Set());
    } catch (error) {
      console.error("Deactivate failed", error);
      toast.error("Failed to deactivate students.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkEnroll = () => {
    navigate('/students/enroll', { state: { selectedStudentIds: Array.from(selectedIds) } });
  };

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const toggleAll = () => {
    if (selectedIds.size === students.length) {
      setSelectedIds(new Set());
    } else {
      const newSet = new Set(students.map(s => s.id));
      setSelectedIds(newSet);
    }
  };

  return (
    <div className="space-y-6 relative font-sans text-slate-900 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Students</h1>
          <p className="text-slate-500 text-sm mt-1">Manage enrollments and academic records.</p>
        </div>
        
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={() => setShowImport(true)} className="bg-white border-slate-200">
            <Upload size={16} className="mr-2 text-slate-500" /> Import
          </Button>
          <Button variant="outline" onClick={() => navigate('/students/enroll')} className="bg-white border-slate-200">
            <Users size={16} className="mr-2 text-slate-500" /> Enroll
          </Button>
          <Button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => navigate('/students/new')}>
            <Plus size={16} /> Add Student
          </Button>
        </div>
      </div>

      {showImport && (
        <ImportStudentsModal onClose={() => setShowImport(false)} onSuccess={() => { fetchStudents(); setShowImport(false); }} />
      )}

      {/* TOOLBAR */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-1 rounded-lg">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Search by name or email..." 
            className="pl-9 h-10 w-full bg-white border-slate-200 focus-visible:ring-indigo-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
           <div className="relative">
             <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
             <select 
               className="pl-9 pr-8 h-10 rounded-md border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer text-slate-700 font-medium"
               value={filterStatus}
               onChange={(e) => setFilterStatus(e.target.value as any)}
             >
               <option value="ACTIVE">Active Only</option>
               <option value="INACTIVE">Inactive Only</option>
               <option value="ALL">All Records</option>
             </select>
           </div>
        </div>
      </div>

      {/* DATA GRID */}
      <Card className="border-slate-200 shadow-sm relative overflow-hidden bg-white">
        
        {/* SELECTION BAR */}
        {selectedIds.size > 0 && (
          <div className="absolute top-0 left-0 right-0 z-10 bg-indigo-50 border-b border-indigo-100 p-2 flex items-center justify-between animate-in slide-in-from-top-2 shadow-sm">
            <div className="flex items-center gap-3 px-4">
              <span className="bg-indigo-600 text-white text-xs font-bold px-2 py-0.5 rounded shadow-sm">{selectedIds.size}</span>
              <span className="text-sm font-medium text-indigo-900">selected</span>
            </div>
            <div className="flex gap-2 pr-2">
              <Button size="sm" variant="outline" className="h-8 bg-white text-indigo-700" onClick={handleBulkEnroll}>
                Enroll
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="h-8 bg-white text-red-600 hover:bg-red-50 border-red-200"
                disabled={isDeleting}
                onClick={() => handleDelete(Array.from(selectedIds))}
              >
                {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Trash2 className="h-3.5 w-3.5 mr-1" />}
                Deactivate
              </Button>
            </div>
          </div>
        )}

        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow className="hover:bg-transparent border-slate-200">
                <TableHead className="w-[50px] pl-4">
                  <input type="checkbox" className="rounded border-slate-300 text-indigo-600 h-4 w-4"
                    checked={students.length > 0 && selectedIds.size === students.length}
                    onChange={toggleAll}
                  />
                </TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Section</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead className="text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                // SKELETONS
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="pl-4"><Skeleton className="h-4 w-4" /></TableCell>
                    <TableCell><div className="flex gap-3"><Skeleton className="h-9 w-9 rounded-full" /><div className="space-y-1"><Skeleton className="h-4 w-24" /><Skeleton className="h-3 w-32" /></div></div></TableCell>
                    <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : students.length === 0 ? (
                // EMPTY STATE
                <TableRow>
                  <TableCell colSpan={6} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-500">
                      <div className="bg-slate-100 p-4 rounded-full mb-3">
                        <AlertCircle className="h-8 w-8 text-slate-400" />
                      </div>
                      <p className="font-medium text-slate-900 text-lg">No students found</p>
                      <Button variant="link" className="mt-2 text-indigo-600" onClick={() => {setSearchTerm(''); setFilterStatus('ALL')}}>Clear filters</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                // DATA ROWS
                students.map((student) => (
                  <TableRow key={student.id} className={`group transition-colors border-slate-100 ${selectedIds.has(student.id) ? "bg-indigo-50/40" : "hover:bg-slate-50"}`}>
                    <TableCell className="pl-4">
                      <input type="checkbox" className="rounded border-slate-300 text-indigo-600 h-4 w-4 cursor-pointer"
                        checked={selectedIds.has(student.id)}
                        onChange={() => toggleSelection(student.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar name={`${student.firstName} ${student.lastName}`} />
                        <div>
                          <div className="font-medium text-slate-900">{student.firstName} {student.lastName}</div>
                          <div className="text-xs text-slate-500">{student.user?.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><StatusBadge isActive={student.user?.isActive ?? false} /></TableCell>
                    <TableCell>
                      {student.enrollments?.[0]?.section?.name || <span className="text-slate-400 italic text-sm">Unenrolled</span>}
                    </TableCell>
                    <TableCell><span className="capitalize text-slate-600 text-sm">{student.gender?.toLowerCase() || "-"}</span></TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                         <Button variant="ghost" size="sm" className="h-8 text-blue-600 hover:bg-blue-50" onClick={() => navigate(`/students/${student.id}/ledger`)}>
                          <CreditCard className="h-4 w-4 mr-1" /> Ledger
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-400 hover:bg-red-50" onClick={() => handleDelete([student.id])}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
        
        {/* PAGINATION FOOTER */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 flex items-center justify-between">
          <p className="text-sm text-slate-500">
             Page <span className="font-medium text-slate-900">{meta.page}</span> of {meta.totalPages} • Total <span className="font-medium text-slate-900">{meta.total}</span> students
          </p>
          <div className="flex gap-2">
            <Button 
              variant="outline" size="sm" 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
              disabled={meta.page === 1}
              className="bg-white"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" size="sm" 
              onClick={() => setCurrentPage(p => Math.min(meta.totalPages, p + 1))} 
              disabled={meta.page >= meta.totalPages}
              className="bg-white"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};