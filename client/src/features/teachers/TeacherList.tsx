// FILE: client/src/features/teachers/TeacherList.tsx
import {
  AlertCircle,
  BookOpen,
  ChevronLeft, ChevronRight,
  Filter,
  MoreVertical,
  Plus,
  Search,
  UserCheck, UserX
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Skeleton } from '../../components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import api from '../../lib/axios';

// -- Types --
interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  specialization: string;
  phone: string;
  user: {
    email: string;
    isActive: boolean;
    lastLogin?: string;
  };
  _count?: {
    classes: number;
  };
}

interface Meta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// -- Components --
const Avatar = ({ name }: { name: string }) => {
  const initials = name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();
  return (
    <div className="h-9 w-9 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
      {initials}
    </div>
  );
};

const WorkloadBadge = ({ count }: { count: number }) => {
  let color = "bg-slate-100 text-slate-600";
  if (count > 0) color = "bg-blue-50 text-blue-700 border-blue-200";
  if (count > 4) color = "bg-amber-50 text-amber-700 border-amber-200";
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium border ${color}`}>
      <BookOpen size={12} />
      {count} Class{count !== 1 && 'es'}
    </span>
  );
};

export const TeacherList = () => {
  const navigate = useNavigate();
  
  // State
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [meta, setMeta] = useState<Meta>({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ACTIVE");
  const [currentPage, setCurrentPage] = useState(1);

  // 1. Fetch Data
  const fetchTeachers = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        search: searchTerm,
        status: filterStatus
      });

      const res = await api.get(`/teachers?${params.toString()}`);
      if (res.data.success) {
        setTeachers(res.data.data);
        setMeta(res.data.meta);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load teachers.");
    } finally {
      setIsLoading(false);
    }
  };

  // Debounce Search
  useEffect(() => {
    const timer = setTimeout(() => fetchTeachers(), 500);
    return () => clearTimeout(timer);
  }, [searchTerm, filterStatus, currentPage]);

  // 2. Actions
  const handleToggleStatus = async (teacher: Teacher) => {
    const action = teacher.user.isActive ? "Deactivate" : "Activate";
    if (!window.confirm(`Are you sure you want to ${action} ${teacher.firstName}?`)) return;

    try {
      await api.patch(`/teachers/${teacher.id}/status`);
      toast.success(`Teacher ${action}d successfully`);
      fetchTeachers(); // Refresh list
    } catch (err) {
      toast.error("Action failed.");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Faculty</h1>
          <p className="text-slate-500 text-sm mt-1">Manage teaching staff and assignments.</p>
        </div>
        <Button onClick={() => navigate('/teachers/new')} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md">
          <Plus size={16} className="mr-2" /> Add Teacher
        </Button>
      </div>

      {/* TOOLBAR */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-1 rounded-lg">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Search name, specialization..." 
            className="pl-9 h-10 w-full bg-white border-slate-200 focus-visible:ring-emerald-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2">
           <div className="relative">
             <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
             <select 
               className="pl-9 pr-8 h-10 rounded-md border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none cursor-pointer text-slate-700 font-medium"
               value={filterStatus}
               onChange={(e) => setFilterStatus(e.target.value as any)}
             >
               <option value="ACTIVE">Active Staff</option>
               <option value="INACTIVE">Inactive / On Leave</option>
               <option value="ALL">All Records</option>
             </select>
           </div>
        </div>
      </div>

      {/* DATA GRID */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow className="hover:bg-transparent border-slate-200">
                <TableHead className="pl-6">Teacher</TableHead>
                <TableHead>Specialization</TableHead>
                <TableHead>Workload</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="pl-6"><div className="flex gap-3"><Skeleton className="h-9 w-9 rounded-full" /><div className="space-y-1"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-24" /></div></div></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20 rounded-md" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : teachers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-500">
                      <div className="bg-slate-100 p-4 rounded-full mb-3">
                        <AlertCircle className="h-8 w-8 text-slate-400" />
                      </div>
                      <p className="font-medium text-slate-900">No teachers found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                teachers.map((teacher) => (
                  <TableRow key={teacher.id} className="group hover:bg-slate-50 transition-colors border-slate-100">
                    <TableCell className="pl-6">
                      <div className="flex items-center gap-3">
                        <Avatar name={`${teacher.firstName} ${teacher.lastName}`} />
                        <div>
                          <div className="font-medium text-slate-900">{teacher.lastName}, {teacher.firstName}</div>
                          <div className="text-xs text-slate-500">{teacher.user.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-slate-700 bg-slate-100 px-2 py-1 rounded">
                        {teacher.specialization}
                      </span>
                    </TableCell>
                    <TableCell>
                      <WorkloadBadge count={teacher._count?.classes || 0} />
                    </TableCell>
                    <TableCell>
                      <button 
                        onClick={() => handleToggleStatus(teacher)}
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold border transition-all ${
                          teacher.user.isActive
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                            : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                        }`}
                      >
                        {teacher.user.isActive ? (
                          <><UserCheck size={12} className="mr-1"/> Active</>
                        ) : (
                          <><UserX size={12} className="mr-1"/> Inactive</>
                        )}
                      </button>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical size={16} className="text-slate-400" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
        
        {/* PAGINATION */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 flex items-center justify-between">
          <p className="text-sm text-slate-500">
             Page <span className="font-medium text-slate-900">{meta.page}</span> of {meta.totalPages}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="bg-white"><ChevronLeft className="h-4 w-4" /></Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(meta.totalPages, p + 1))} disabled={meta.page >= meta.totalPages} className="bg-white"><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      </Card>
    </div>
  );
};