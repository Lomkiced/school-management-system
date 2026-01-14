// FILE: client/src/features/students/StudentList.tsx
import {
  AlertCircle,
  ChevronLeft, ChevronRight,
  CreditCard,
  Filter,
  Plus,
  Search,
  Trash2,
  Upload,
  UserCheck, UserX,
  Users
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
import { ImportStudentsModal } from './ImportStudentsModal';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  gender: string;
  user: {
    email: string;
    isActive: boolean;
  };
  // FIX: Match actual API response structure (class, not section)
  enrollments: {
    id: string;
    classId: string;
    class: {
      id: string;
      name: string;
      subject?: {
        name: string;
        code: string;
      } | null;
    };
  }[];
  _count?: {
    enrollments: number;
    grades: number;
  };
}

interface Meta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const Avatar = ({ name }: { name: string }) => {
  const initials = name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();
  return (
    <div className="h-9 w-9 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
      {initials}
    </div>
  );
};

export const StudentList = () => {
  const navigate = useNavigate();

  const [students, setStudents] = useState<Student[]>([]);
  const [meta, setMeta] = useState<Meta>({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [showImport, setShowImport] = useState(false);

  const fetchStudents = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        search: searchTerm,
        status: filterStatus
      });

      const response = await api.get(`/students?${params.toString()}`);
      if (response.data.success) {
        setStudents(response.data.data);
        setMeta(response.data.meta);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load students.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => fetchStudents(), 500);
    return () => clearTimeout(timer);
  }, [searchTerm, filterStatus, currentPage]);

  // === ACTION 1: TOGGLE STATUS (Soft Delete) ===
  const handleToggleStatus = async (student: Student) => {
    // Optimistic Update
    setStudents(prev => prev.map(s =>
      s.id === student.id ? { ...s, user: { ...s.user, isActive: !s.user.isActive } } : s
    ));

    try {
      await api.patch(`/students/${student.id}/status`);
      toast.success(`Student status updated`);
    } catch (error) {
      toast.error("Failed to update status.");
      fetchStudents(); // Revert
    }
  };

  // === ACTION 2: HARD DELETE ===
  const handleDelete = async (id: string) => {
    if (!window.confirm("WARNING: This will PERMANENTLY DELETE this student. You can use their email again after this.")) return;

    try {
      await api.delete(`/students/${id}`);
      setStudents(prev => prev.filter(s => s.id !== id));
      toast.success("Student deleted permanently.");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete student.");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Students</h1>
          <p className="text-slate-500 text-sm mt-1">Manage enrollments, status, and records.</p>
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
            placeholder="Search student..."
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
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* DATA GRID */}
      <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow className="hover:bg-transparent border-slate-200">
                <TableHead className="pl-6">Student</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Classes</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead className="text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="pl-6"><Skeleton className="h-4 w-4" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : students.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-500">
                      <div className="bg-slate-100 p-4 rounded-full mb-3">
                        <AlertCircle className="h-8 w-8 text-slate-400" />
                      </div>
                      <p className="font-medium text-slate-900 text-lg">No students found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                students.map((student) => (
                  <TableRow key={student.id} className="group hover:bg-slate-50 transition-colors border-slate-100">
                    <TableCell className="pl-6">
                      <div className="flex items-center gap-3">
                        <Avatar name={`${student.firstName} ${student.lastName}`} />
                        <div>
                          <div className="font-medium text-slate-900">{student.firstName} {student.lastName}</div>
                          <div className="text-xs text-slate-500">{student.user.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => handleToggleStatus(student)}
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold border transition-all ${student.user.isActive
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                            : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                          }`}
                      >
                        {student.user.isActive ? (
                          <><UserCheck size={12} className="mr-1" /> Active</>
                        ) : (
                          <><UserX size={12} className="mr-1" /> Inactive</>
                        )}
                      </button>
                    </TableCell>
                    <TableCell>
                      {student.enrollments && student.enrollments.length > 0 ? (
                        <div className="space-y-1">
                          {student.enrollments.slice(0, 2).map((enrollment, idx) => (
                            <div key={enrollment.id || idx} className="text-sm">
                              <span className="font-medium text-slate-700">{enrollment.class?.name}</span>
                              {enrollment.class?.subject && (
                                <span className="text-xs text-slate-400 ml-1">({enrollment.class.subject.code})</span>
                              )}
                            </div>
                          ))}
                          {student.enrollments.length > 2 && (
                            <span className="text-xs text-indigo-600">+{student.enrollments.length - 2} more</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-sm">Not enrolled</span>
                      )}
                    </TableCell>
                    <TableCell><span className="capitalize text-slate-600 text-sm">{student.gender?.toLowerCase()}</span></TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-blue-600 hover:bg-blue-50"
                          onClick={() => navigate(`/students/${student.id}/ledger`)}
                        >
                          <CreditCard className="h-4 w-4 mr-1" /> Ledger
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleDelete(student.id)}
                          title="Delete Permanently"
                        >
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

        {/* FOOTER */}
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