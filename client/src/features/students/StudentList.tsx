import {
  ChevronLeft, ChevronRight,
  CreditCard,
  Download,
  Filter,
  MoreVertical,
  Plus,
  Search,
  Trash2,
  Upload,
  Users
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import api from '../../lib/axios';
import { ImportStudentsModal } from './ImportStudentsModal';

// --- Types ---
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

// --- Helper Components ---
const Avatar = ({ name }: { name: string }) => {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
  const colors = ['bg-blue-600', 'bg-violet-600', 'bg-emerald-600', 'bg-amber-600', 'bg-rose-600'];
  const colorIndex = name.length % colors.length;

  return (
    <div className={`h-9 w-9 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm ${colors[colorIndex]}`}>
      {initials}
    </div>
  );
};

const StatusBadge = ({ isActive }: { isActive: boolean }) => {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
      isActive 
        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
        : 'bg-slate-100 text-slate-600 border-slate-200'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isActive ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );
};

export const StudentList = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showImport, setShowImport] = useState(false);
  
  // -- Advanced State --
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const itemsPerPage = 10;

  const fetchStudents = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/students');
      const data = Array.isArray(response.data) ? response.data : response.data.data || [];
      setStudents(data);
    } catch (error) {
      console.error("Failed to fetch students", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // -- Logic: Filter & Search --
  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
      const email = student.user.email.toLowerCase();
      const searchLower = searchTerm.toLowerCase();
      
      const matchesSearch = fullName.includes(searchLower) || email.includes(searchLower);
      const matchesStatus = 
        filterStatus === "ALL" ? true :
        filterStatus === "ACTIVE" ? student.user.isActive :
        !student.user.isActive;

      return matchesSearch && matchesStatus;
    });
  }, [students, searchTerm, filterStatus]);

  // -- Logic: Pagination --
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // -- Logic: Selection --
  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const toggleAll = () => {
    if (selectedIds.size === paginatedStudents.length) {
      setSelectedIds(new Set());
    } else {
      const newSet = new Set(paginatedStudents.map(s => s.id));
      setSelectedIds(newSet);
    }
  };

  return (
    <div className="space-y-6 relative">
      
      {/* HEADER AREA */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Students</h1>
          <p className="text-slate-500 text-sm mt-1">Manage enrollments, academic records, and profiles.</p>
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          {/* IMPORT BUTTON */}
          <Button variant="outline" onClick={() => setShowImport(true)} className="bg-white">
            <Upload size={16} className="mr-2 text-slate-500" /> Import
          </Button>

          {/* ENROLL BUTTON (Restored) */}
          <Button variant="outline" onClick={() => navigate('/students/enroll')} className="bg-white">
            <Users size={16} className="mr-2 text-slate-500" /> Enroll to Section
          </Button>

          {/* ADD STUDENT BUTTON */}
          <Button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => navigate('/students/new')}>
            <Plus size={16} /> Add Student
          </Button>
        </div>
      </div>

      {/* RENDER IMPORT MODAL */}
      {showImport && (
        <ImportStudentsModal 
            onClose={() => setShowImport(false)} 
            onSuccess={() => { fetchStudents(); setShowImport(false); }} 
        />
      )}

      {/* ADVANCED TOOLBAR */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-1 rounded-lg">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            placeholder="Search student..." 
            className="pl-9 h-10 w-full rounded-md border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
           {/* Status Filter */}
           <div className="relative">
             <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
             <select 
               className="pl-9 pr-8 h-10 rounded-md border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
               value={filterStatus}
               onChange={(e) => setFilterStatus(e.target.value as any)}
             >
               <option value="ALL">All Status</option>
               <option value="ACTIVE">Active</option>
               <option value="INACTIVE">Inactive</option>
             </select>
           </div>
           
           <Button variant="outline" size="icon" title="Export">
             <Download className="h-4 w-4 text-slate-500" />
           </Button>
        </div>
      </div>

      {/* DATA GRID CARD */}
      <Card className="border-slate-200 shadow-sm relative overflow-hidden">
        
        {/* FLOATING BULK ACTIONS BAR */}
        {selectedIds.size > 0 && (
          <div className="absolute top-0 left-0 right-0 z-10 bg-indigo-50 border-b border-indigo-100 p-2 flex items-center justify-between animate-in slide-in-from-top-2">
            <div className="flex items-center gap-3 px-4">
              <span className="bg-indigo-600 text-white text-xs font-bold px-2 py-0.5 rounded">{selectedIds.size}</span>
              <span className="text-sm font-medium text-indigo-900">selected</span>
            </div>
            <div className="flex gap-2 pr-2">
              <Button 
                size="sm" 
                variant="outline" 
                className="h-8 bg-white border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                onClick={() => navigate('/students/enroll')} // Fixed: Navigates to enroll page
              >
                Enroll to Section
              </Button>
              <Button size="sm" variant="outline" className="h-8 bg-white border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700">
                <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
              </Button>
            </div>
          </div>
        )}

        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[50px] pl-4">
                  <input 
                    type="checkbox" 
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                    checked={paginatedStudents.length > 0 && selectedIds.size === paginatedStudents.length}
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
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                    Loading records...
                  </TableCell>
                </TableRow>
              ) : paginatedStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-500">
                      <div className="bg-slate-100 p-3 rounded-full mb-2">
                        <Search className="h-6 w-6 text-slate-400" />
                      </div>
                      <p className="font-medium text-slate-900">No students found</p>
                      <p className="text-sm">Try adjusting your search or filters.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedStudents.map((student) => (
                  <TableRow key={student.id} className={`group ${selectedIds.has(student.id) ? "bg-indigo-50/50 hover:bg-indigo-50/70" : "hover:bg-slate-50"}`}>
                    <TableCell className="pl-4">
                      <input 
                        type="checkbox" 
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                        checked={selectedIds.has(student.id)}
                        onChange={() => toggleSelection(student.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar name={`${student.firstName} ${student.lastName}`} />
                        <div>
                          <div className="font-medium text-slate-900">{student.firstName} {student.lastName}</div>
                          <div className="text-xs text-slate-500">{student.user.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge isActive={student.user.isActive} />
                    </TableCell>
                    <TableCell>
                      {student.enrollments.length > 0 ? (
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-700">{student.enrollments[0].section.name}</span>
                          <span className="text-xs text-slate-400">Enrolled</span>
                        </div>
                      ) : (
                         <span className="text-slate-400 italic text-sm">Unenrolled</span>
                      )}
                    </TableCell>
                    <TableCell>
                       <span className="capitalize text-slate-600">{student.gender.toLowerCase()}</span>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                         <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          onClick={() => navigate(`/students/${student.id}/ledger`)}
                        >
                          <CreditCard className="h-4 w-4 mr-1" /> Ledger
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4 text-slate-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
        
        {/* FOOTER PAGINATION */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 flex items-center justify-between">
          <p className="text-sm text-slate-500">
             Showing <span className="font-medium text-slate-900">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium text-slate-900">{Math.min(currentPage * itemsPerPage, filteredStudents.length)}</span> of {filteredStudents.length}
          </p>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="bg-white"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
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