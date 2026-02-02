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
interface TeacherClass {
  id: string;
  name: string;
  subject?: {
    name: string;
    code: string;
  } | null;
}

interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  specialization?: string | null;
  phone?: string | null;
  user: {
    email: string;
    isActive: boolean;
    lastLogin?: string;
  };
  classes: TeacherClass[];
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
  const colors = [
    'bg-gradient-to-br from-indigo-500 to-purple-600',
    'bg-gradient-to-br from-emerald-500 to-teal-600',
    'bg-gradient-to-br from-amber-500 to-orange-600',
    'bg-gradient-to-br from-rose-500 to-pink-600',
    'bg-gradient-to-br from-cyan-500 to-blue-600'
  ];
  const colorIndex = name.charCodeAt(0) % colors.length;

  return (
    <div className={`h-10 w-10 rounded-xl ${colors[colorIndex]} flex items-center justify-center text-white text-sm font-bold shadow-lg`}>
      {initials}
    </div>
  );
};

// Class badges component
const ClassBadges = ({ classes }: { classes: TeacherClass[] }) => {
  if (classes.length === 0) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
        No Classes
      </span>
    );
  }

  // Show first 2 badges, then "+N more"
  const visibleClasses = classes.slice(0, 2);
  const remainingCount = classes.length - 2;

  return (
    <div className="flex flex-wrap gap-1.5">
      {visibleClasses.map((cls) => (
        <span
          key={cls.id}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200"
          title={cls.subject ? `${cls.subject.code} - ${cls.subject.name}` : cls.name}
        >
          <BookOpen size={10} />
          {cls.name}
        </span>
      ))}
      {remainingCount > 0 && (
        <span
          className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200"
          title={classes.slice(2).map(c => c.name).join(', ')}
        >
          +{remainingCount} more
        </span>
      )}
    </div>
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
        <Button onClick={() => navigate('/teachers/new')} className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg">
          <Plus size={16} className="mr-2" /> Add Teacher
        </Button>
      </div>

      {/* TOOLBAR */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-1 rounded-lg">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search name, specialization..."
            className="pl-9 h-10 w-full bg-white border-slate-200 focus-visible:ring-indigo-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
            <select
              className="pl-9 pr-8 h-10 rounded-md border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer text-slate-700 font-medium"
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
      <Card className="border-slate-200 shadow-lg overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow className="hover:bg-transparent border-slate-200">
                <TableHead className="pl-6">Teacher</TableHead>
                <TableHead>Specialization</TableHead>
                <TableHead>Assigned Classes</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="pl-6"><div className="flex gap-3"><Skeleton className="h-10 w-10 rounded-xl" /><div className="space-y-1"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-24" /></div></div></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-32 rounded-lg" /></TableCell>
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
                      {teacher.specialization ? (
                        <span className="text-sm text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                          {teacher.specialization}
                        </span>
                      ) : (
                        <span className="text-sm text-slate-400 italic">Not set</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <ClassBadges classes={teacher.classes || []} />
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => handleToggleStatus(teacher)}
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${teacher.user.isActive
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                            : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                          }`}
                      >
                        {teacher.user.isActive ? (
                          <><UserCheck size={12} className="mr-1" /> Active</>
                        ) : (
                          <><UserX size={12} className="mr-1" /> Inactive</>
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