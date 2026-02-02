// FILE: client/src/features/people/faculty/FacultyManager.tsx
import { ArrowLeft, Printer, Search, UserMinus, UserPlus, Briefcase, Plus, Mail, Phone, BadgeCheck, FileText, Users, Calendar, BookOpen, RefreshCw } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import { useReactToPrint } from 'react-to-print';
import { toast } from 'sonner';
import { IDCardTemplate } from '../../../components/people/IDCardTemplate';
import { FolderItem } from '../../../components/ui/FolderItem';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { AddFacultyModal } from './AddFacultyModal';
import { AddDepartmentModal } from './AddDepartmentModal';
import api from '../../../lib/axios';

// --- INTERNAL COMPONENT: CLASS BADGES ---
const ClassBadges = ({ classes }: { classes: any[] }) => {
    if (!classes || classes.length === 0) {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-100 text-rose-700 rounded-full text-xs font-bold border border-rose-200">
                <RefreshCw size={12} />
                No Classes
            </span>
        );
    }

    // Show first 2 badges, then "+N more"
    const visibleClasses = classes.slice(0, 2);
    const remainingCount = classes.length - 2;

    return (
        <div className="flex flex-col gap-1.5 items-start">
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
            </div>
            {remainingCount > 0 && (
                <span className="text-[10px] text-slate-500 font-medium pl-1">
                    +{remainingCount} more assigned
                </span>
            )}
        </div>
    );
};

// --- INTERNAL COMPONENT: STATS RIBBON ---
const StatsRibbon = ({ stats }: { stats: { totalFaculty: number; totalDepartments: number; unassignedCount: number } }) => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 text-slate-800 dark:text-slate-200">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                <Users size={24} />
            </div>
            <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Faculty</p>
                <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-slate-900">{stats.totalFaculty}</span>
                    <span className="text-xs text-emerald-600 font-bold flex items-center gap-0.5">
                        <BadgeCheck size={12} /> Active
                    </span>
                </div>
            </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-xl">
                <Briefcase size={24} />
            </div>
            <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Departments</p>
                <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-slate-900">{stats.totalDepartments}</span>
                    <span className="text-xs text-slate-400">Academic Units</span>
                </div>
            </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="p-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-xl">
                <Calendar size={24} />
            </div>
            <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">No Classes</p>
                <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-slate-900">{stats.unassignedCount}</span>
                    <span className="text-xs text-slate-400">Need Assignment</span>
                </div>
            </div>
        </div>
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-4 rounded-2xl shadow-lg text-white flex items-center justify-between relative overflow-hidden group cursor-pointer">
            <div className="relative z-10">
                <p className="text-xs font-bold text-indigo-100 uppercase tracking-wider mb-1">Quick Action</p>
                <p className="font-bold text-lg flex items-center gap-2">
                    Workload Report
                </p>
            </div>
            <FileText className="text-white/20 w-16 h-16 absolute -right-4 -bottom-4 rotate-12 group-hover:scale-110 transition-transform" />
        </div>
    </div>
);

export const FacultyManager = () => {
    const [view, setView] = useState<'departments' | 'faculty'>('departments');
    const [selectedDept, setSelectedDept] = useState<any | null>(null);
    const [departments, setDepartments] = useState<any[]>([]);
    const [faculty, setFaculty] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [unassignedCount, setUnassignedCount] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');

    // Computed Stats
    const stats = {
        totalFaculty: departments.reduce((acc, d) => acc + (d._count?.teachers || 0), 0),
        totalDepartments: departments.length,
        unassignedCount
    };

    // Modals
    const [isAddFactoryOpen, setIsAddFacultyOpen] = useState(false);
    const [isAddDeptOpen, setIsAddDeptOpen] = useState(false);

    // ID Printing
    const [personToPrint, setPersonToPrint] = useState<any | null>(null);
    const idCardRef = useRef<HTMLDivElement>(null);
    const handlePrint = useReactToPrint({
        content: () => idCardRef.current,
        onAfterPrint: () => setPersonToPrint(null)
    });

    useEffect(() => {
        if (personToPrint) handlePrint();
    }, [personToPrint, handlePrint]);

    // Init: Load Departments and Unassigned Count
    useEffect(() => {
        fetchDepartments();
        fetchUnassignedCount();
    }, []);

    const fetchDepartments = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/departments');
            setDepartments(res.data.data || []);
        } catch (e) {
            toast.error('Failed to load departments');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchUnassignedCount = async () => {
        try {
            // Fetch count of teachers with no classes assigned
            const res = await api.get('/teachers?assignmentStatus=unassigned&limit=1');
            setUnassignedCount(res.data.meta?.total || 0);
        } catch (e) {
            console.error('Failed to fetch unassigned count', e);
        }
    };

    const fetchFaculty = async (deptId: string, isUnassigned = false) => {
        setIsLoading(true);
        try {
            if (isUnassigned) {
                // Fetch teachers with NO class assignments (the real unassigned)
                const res = await api.get('/teachers?assignmentStatus=unassigned&limit=100');
                setFaculty(res.data.data || []);
            } else if (deptId === 'no-dept') {
                // Fetch teachers with no department
                const res = await api.get('/teachers?departmentId=null&limit=100');
                setFaculty(res.data.data || []);
            } else {
                // Fetch via department
                const res = await api.get(`/departments/${deptId}`);
                setFaculty(res.data.data.teachers || []);
            }
        } catch (e) {
            toast.error('Failed to load faculty');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeptClick = (dept: any) => {
        setSelectedDept(dept);
        fetchFaculty(dept.id);
        setView('faculty');
    };

    // Filter faculty by search
    const filteredFaculty = faculty.filter(f => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            f.firstName?.toLowerCase().includes(query) ||
            f.lastName?.toLowerCase().includes(query) ||
            f.user?.email?.toLowerCase().includes(query)
        );
    });

    const renderDepartments = () => {
        if (isLoading) return (
            <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                <div className="w-16 h-16 bg-indigo-100 rounded-full mb-4" />
                <div className="h-4 w-48 bg-slate-200 rounded mb-2" />
                <div className="h-3 w-32 bg-slate-100 rounded" />
            </div>
        );

        return (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {/* Add Department Card (always first/special) */}
                    <div
                        onClick={() => setIsAddDeptOpen(true)}
                        className="border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center text-slate-400 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all cursor-pointer h-full min-h-[140px] group"
                    >
                        <div className="w-12 h-12 rounded-full bg-slate-100 group-hover:bg-indigo-200 flex items-center justify-center mb-3 transition-colors">
                            <Plus size={24} />
                        </div>
                        <span className="font-bold">Add Department</span>
                    </div>

                    {departments.map(d => (
                        <div key={d.id} className="relative group">
                            <FolderItem
                                label={d.name}
                                subLabel={`${d._count?.teachers || 0} Faculty Member${d._count?.teachers !== 1 ? 's' : ''}`}
                                color="text-indigo-600"
                                variant="glass"
                                count={d._count?.teachers}
                                onClick={() => handleDeptClick(d)}
                            />
                        </div>
                    ))}

                    {/* Unassigned Faculty Folder - NOW BASED ON CLASS ASSIGNMENT */}
                    <div className="relative group">
                        <FolderItem
                            label="Unassigned"
                            subLabel="No Classes Assigned"
                            color="text-rose-500"
                            variant="glass"
                            count={unassignedCount}
                            onClick={() => {
                                setSelectedDept({ id: 'unassigned', name: 'Unassigned Faculty', isUnassigned: true });
                                fetchFaculty('', true); // Pass isUnassigned flag
                                setView('faculty');
                            }}
                        />
                    </div>

                    {/* No Department Folder - Separate from Unassigned */}
                    <div className="relative group">
                        <FolderItem
                            label="No Department"
                            subLabel="Department Not Set"
                            color="text-slate-500"
                            variant="glass"
                            onClick={() => {
                                setSelectedDept({ id: 'no-dept', name: 'No Department' });
                                fetchFaculty('no-dept');
                                setView('faculty');
                            }}
                        />
                    </div>
                </div>
            </div>
        );
    };

    const renderFacultyList = () => {
        if (isLoading) return (
            <div className="p-12 text-center pb-32">
                <Users className="w-16 h-16 text-slate-200 mx-auto mb-4 animate-bounce" />
                <p className="text-slate-500 font-medium">Loading Faculty Roster...</p>
            </div>
        );

        return (
            <Card className="border-0 shadow-lg ring-1 ring-slate-100 bg-white/50 backdrop-blur-sm animate-in fade-in duration-500">
                <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 bg-white/50 pb-6">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-xl">
                            <Briefcase className="text-indigo-600" size={24} />
                            Faculty in <span className="text-indigo-600">{selectedDept?.name}</span>
                        </CardTitle>
                        <p className="text-sm text-slate-500 mt-1">
                            {selectedDept?.isUnassigned
                                ? 'Teachers who have not been assigned to any class'
                                : 'Manage staff assignments and profiles'
                            }
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <div className="relative group">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search faculty..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 h-10 w-64 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all shadow-sm"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50/50 text-slate-500 font-bold uppercase text-xs tracking-wider border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4">Faculty Profile</th>
                                    <th className="px-6 py-4">Contact Info</th>
                                    <th className="px-6 py-4">Classes</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredFaculty.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-16 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
                                                    <Briefcase size={32} className="text-indigo-300" />
                                                </div>
                                                <h3 className="text-lg font-bold text-slate-700">No Faculty Found</h3>
                                                <p className="text-slate-500 mb-6 max-w-sm">
                                                    {selectedDept?.isUnassigned
                                                        ? 'All teachers have been assigned to classes!'
                                                        : 'This department currently has no assigned faculty members.'
                                                    }
                                                </p>
                                                {!selectedDept?.isUnassigned && (
                                                    <button onClick={() => setIsAddFacultyOpen(true)} className="text-indigo-600 font-bold hover:underline">
                                                        Assign First Faculty
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredFaculty.map((f, i) => (
                                    <tr key={f.id} className="group hover:bg-indigo-50/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="relative">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-sm ring-2 ring-white bg-gradient-to-br from-indigo-500 to-purple-600`}>
                                                        {f.firstName?.[0]}{f.lastName?.[0]}
                                                    </div>
                                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white" />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-900 text-base flex items-center gap-2">
                                                        {f.firstName} {f.lastName}
                                                        {i === 0 && !selectedDept?.isUnassigned && <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded uppercase">Head</span>}
                                                    </div>
                                                    <div className="text-xs text-slate-500 font-mono mt-0.5">
                                                        {f.department?.name || 'No Department'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-slate-600">
                                                    <Mail size={12} className="text-slate-400" /> {f.user?.email}
                                                </div>
                                                <div className="flex items-center gap-2 text-slate-600">
                                                    <Phone size={12} className="text-slate-400" /> {f.phone || 'N/A'}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <ClassBadges classes={f.classes} />
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold border border-emerald-200">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                                                Active
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => setPersonToPrint({ ...f, idNumber: `FAC-${202400 + i}`, role: 'Faculty', department: f.department?.name || selectedDept?.name })}
                                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                                    title="Print ID Card"
                                                >
                                                    <Printer size={18} />
                                                </button>
                                                <button className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all">
                                                    <UserMinus size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto animate-in fade-in duration-500">
            <StatsRibbon stats={stats} />

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    {view !== 'departments' && (
                        <button onClick={() => { setView('departments'); setSearchQuery(''); }} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                            <ArrowLeft size={24} className="text-slate-600" />
                        </button>
                    )}
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                            Faculty Manager
                        </h1>
                        <p className="text-slate-500">
                            {view === 'departments' ? 'Select a department to manage faculty' :
                                `Managing faculty in ${selectedDept?.name}`}
                        </p>
                    </div>
                </div>

                {/* Global Add Button */}
                <button
                    onClick={() => setIsAddFacultyOpen(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 font-bold shadow-lg shadow-indigo-200 transition-all active:scale-95"
                >
                    <UserPlus size={20} />
                    <span>Add Faculty</span>
                </button>
            </div>

            <div className="min-h-[500px]">
                {view === 'departments' && renderDepartments()}
                {view === 'faculty' && renderFacultyList()}
            </div>

            <div style={{ display: 'none' }}>
                <IDCardTemplate
                    ref={idCardRef}
                    user={personToPrint || { id: '', firstName: '', lastName: '', role: 'Faculty', idNumber: '' }}
                    variant="faculty"
                />
            </div>

            {/* MODALS */}
            <AddFacultyModal
                isOpen={isAddFactoryOpen}
                onClose={() => setIsAddFacultyOpen(false)}
                onFacultyAdded={() => {
                    if (selectedDept) fetchFaculty(selectedDept.id, selectedDept.isUnassigned);
                    fetchDepartments();
                    fetchUnassignedCount();
                }}
            />

            <AddDepartmentModal
                isOpen={isAddDeptOpen}
                onClose={() => setIsAddDeptOpen(false)}
                onDepartmentAdded={fetchDepartments}
            />
        </div>
    );
};

