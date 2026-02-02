// FILE: client/src/features/people/students/StudentManager.tsx
import { ArrowRight, ArrowLeft, Printer, Search, UserPlus, Plus, Trash2, GraduationCap, User, Key, FileText, Users, TrendingUp, School, Folder, ChevronRight } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import { useReactToPrint } from 'react-to-print';
import { toast } from 'sonner';
import { IDCardTemplate } from '../../../components/people/IDCardTemplate';
import { CredentialSlip } from '../../../components/people/CredentialSlip';
import { ClassCredentialSlips } from '../../../components/people/ClassCredentialSlips';
import { FolderItem } from '../../../components/ui/FolderItem';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Modal } from '../../../components/ui/Modal';
import { AddStudentModal } from './AddStudentModal';
import { ManageGradeLevelsModal } from './ManageGradeLevelsModal'; // Added Import
import api from '../../../lib/axios';

// --- INTERNAL COMPONENTS ---
const StatsRibbon = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 text-slate-800 dark:text-slate-200">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                <Users size={24} />
            </div>
            <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Students</p>
                <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">1,248</span>
                    <span className="text-xs text-emerald-600 font-bold flex items-center gap-0.5">
                        <TrendingUp size={10} /> +12%
                    </span>
                </div>
            </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-xl">
                <UserPlus size={24} />
            </div>
            <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">New Admissions</p>
                <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-slate-900">24</span>
                    <span className="text-xs text-slate-400">this month</span>
                </div>
            </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-xl">
                <School size={24} />
            </div>
            <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Sections</p>
                <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-slate-900">36</span>
                    <span className="text-xs text-slate-400">across 12 grades</span>
                </div>
            </div>
        </div>
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-4 rounded-2xl shadow-lg text-white flex items-center justify-between relative overflow-hidden group cursor-pointer">
            <div className="relative z-10">
                <p className="text-xs font-bold text-indigo-100 uppercase tracking-wider mb-1">Quick Action</p>
                <p className="font-bold text-lg flex items-center gap-2">
                    Generate Reports <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </p>
            </div>
            <FileText className="text-white/20 w-16 h-16 absolute -right-4 -bottom-4 rotate-12 group-hover:scale-110 transition-transform" />
        </div>
    </div>
);

export const StudentManager = () => {
    const [view, setView] = useState<'grades' | 'sections' | 'students' | 'unenrolled'>('grades');
    const [selectedGrade, setSelectedGrade] = useState<number | null>(null);
    const [selectedClass, setSelectedClass] = useState<any | null>(null); // Full class object
    const [classes, setClasses] = useState<any[]>([]);
    const [students, setStudents] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Modals & Actions
    // Modals & Actions
    const [isCreateSectionOpen, setIsCreateSectionOpen] = useState(false);
    const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
    const [isManageLevelsOpen, setIsManageLevelsOpen] = useState(false); // New Modal State
    const [isMoveStudentOpen, setIsMoveStudentOpen] = useState(false);

    const [gradeLevels, setGradeLevels] = useState<any[]>([]); // Dynamic Levels

    // Credential Modals
    const [isCredentialModalOpen, setIsCredentialModalOpen] = useState(false);
    const [isClassCredentialModalOpen, setIsClassCredentialModalOpen] = useState(false);

    const [sectionName, setSectionName] = useState('');
    const [studentToPrint, setStudentToPrint] = useState<any | null>(null);
    const [studentToMove, setStudentToMove] = useState<any | null>(null);
    const [studentForCredentials, setStudentForCredentials] = useState<any | null>(null); // For Individual

    const [targetClassId, setTargetClassId] = useState('');
    const [targetGrade, setTargetGrade] = useState<number>(1); // For Placement Modal

    // Print States
    const [credentialsToPrint, setCredentialsToPrint] = useState<any | null>(null); // Single
    const [classCredentialsToPrint, setClassCredentialsToPrint] = useState<any | null>(null); // Bulk { className, students: [] }

    // Logic States for Credential Modals
    const [resetToDefault, setResetToDefault] = useState(false);
    const [showDefaultPassword, setShowDefaultPassword] = useState(true);

    // Print Refs
    const idCardRef = useRef<HTMLDivElement>(null);
    const credentialSlipRef = useRef<HTMLDivElement>(null);
    const classCredentialSlipRef = useRef<HTMLDivElement>(null);

    const handlePrintID = useReactToPrint({
        content: () => idCardRef.current,
        onAfterPrint: () => setStudentToPrint(null)
    });

    const handlePrintCredentials = useReactToPrint({
        content: () => credentialSlipRef.current,
        onAfterPrint: () => setCredentialsToPrint(null)
    });

    const handlePrintClassCredentials = useReactToPrint({
        content: () => classCredentialSlipRef.current,
        onAfterPrint: () => setClassCredentialsToPrint(null)
    });

    useEffect(() => {
        if (studentToPrint) handlePrintID();
    }, [studentToPrint, handlePrintID]);

    useEffect(() => {
        if (credentialsToPrint) handlePrintCredentials();
    }, [credentialsToPrint, handlePrintCredentials]);

    useEffect(() => {
        if (classCredentialsToPrint) handlePrintClassCredentials();
    }, [classCredentialsToPrint, handlePrintClassCredentials]);

    useEffect(() => {
        if (view === 'sections' && selectedGrade) fetchClassesForGrade(selectedGrade);
    }, [view, selectedGrade]);

    useEffect(() => {
        if (view === 'students' && selectedClass) fetchStudentsForClass(selectedClass.id);
    }, [view, selectedClass]);



    useEffect(() => {
        fetchGradeLevels();
    }, []);

    const fetchGradeLevels = async () => {
        try {
            const res = await api.get('/grade-levels');
            setGradeLevels(res.data.data);
        } catch (e) {
            console.error('Failed to load grade levels', e);
            // Fallback to static if fail
            setGradeLevels([...Array(12)].map((_, i) => ({
                id: `static-${i}`, label: `Grade ${i + 1}`, value: i + 1, category: i < 6 ? 'Elementary' : 'High School'
            })));
        }
    };

    const fetchClassesForGrade = async (grade: number) => {
        setIsLoading(true);
        try {
            const res = await api.get('/classes');
            const all = res.data.data;
            const filtered = all.filter((c: any) => c.name.includes(`Grade ${grade}`) || (grade > 12 && c.name.includes('College')) || c.name.startsWith(grade.toString()));
            setClasses(filtered);
        } catch (e) {
            toast.error('Failed to load classes');
        } finally {
            setIsLoading(false);
        }
    };

    // Helper to fetch classes for the modal dropdown without changing main view state ideally
    // But for now reusing 'classes' state is acceptable if we are in a modal.
    const fetchClassesForDropdown = async (grade: number) => {
        try {
            const res = await api.get('/classes');
            const all = res.data.data;
            const filtered = all.filter((c: any) => c.name.includes(`Grade ${grade}`) || (grade > 12 && c.name.includes('College')) || c.name.startsWith(grade.toString()));
            setClasses(filtered);
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        if (isMoveStudentOpen && targetGrade) {
            fetchClassesForDropdown(targetGrade);
        }
    }, [targetGrade, isMoveStudentOpen]);

    const fetchStudentsForClass = async (classId: string) => {
        setIsLoading(true);
        try {
            if (classId === 'all') {
                setStudents([]);
                return;
            }
            const res = await api.get(`/classes/${classId}/students`);
            setStudents(res.data.data || []);
        } catch (e) {
            toast.error('Failed to load students');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchUnenrolledStudents = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/students/unenrolled');
            setStudents(res.data.data || []);
        } catch (e) {
            toast.error('Failed to load unenrolled students');
        } finally {
            setIsLoading(false);
        }
    };

    // --- ACTIONS ---

    const handleCreateSection = async () => {
        if (!sectionName) return;
        try {
            await api.post('/classes', {
                name: `Grade ${selectedGrade} - ${sectionName}`,
            });
            toast.success('Section created');
            setIsCreateSectionOpen(false);
            setSectionName('');
            if (selectedGrade) fetchClassesForGrade(selectedGrade);
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Failed to create section');
        }
    };

    const handleDeleteSection = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this section? This cannot be undone.')) return;
        try {
            await api.delete(`/classes/${id}`);
            toast.success('Section deleted');
            if (selectedGrade) fetchClassesForGrade(selectedGrade);
        } catch (e) {
            toast.error('Failed to delete section');
        }
    };

    // --- CREDENTIAL PRINTING LOGIC ---

    const openIndividualCredentialModal = (student: any) => {
        setStudentForCredentials(student);
        setResetToDefault(false);
        setIsCredentialModalOpen(true);
    };

    const handlePrintIndividualCredentials = async () => {
        if (!studentForCredentials) return;

        let passwordToPrint = undefined;

        if (resetToDefault) {
            try {
                // Actually reset the password on the backend
                await api.patch(`/students/${studentForCredentials.id}`, {
                    password: 'Student123'
                });
                passwordToPrint = 'Student123';
                toast.success('Password reset to Student123');
            } catch (e) {
                toast.error('Failed to reset password. Printing without password.');
                console.error(e);
            }
        }

        setCredentialsToPrint({
            studentName: `${studentForCredentials.firstName} ${studentForCredentials.lastName}`,
            email: studentForCredentials.user?.email,
            password: passwordToPrint,
            role: 'Student', // Explicitly set role
            schoolName: 'DOST High School' // Ensure consistency
        });

        // Small delay to allow state to propagate before printing
        setTimeout(() => {
            if (credentialSlipRef.current) {
                handlePrintCredentials();
            }
        }, 100);

        setIsCredentialModalOpen(false);
    };

    const handlePrintClassCredentialsList = () => {
        const list = students.map(s => ({
            name: `${s.firstName} ${s.lastName}`,
            email: s.user?.email,
            password: showDefaultPassword ? 'Student123' : undefined
        }));

        setClassCredentialsToPrint({
            className: selectedClass?.name || 'Class List',
            students: list
        });
        setIsClassCredentialModalOpen(false);
    };

    // ---------------------------------

    const handleMoveStudent = async () => {
        if (!studentToMove || !targetClassId) return;
        try {
            await api.post(`/classes/${targetClassId}/enroll`, { studentId: studentToMove.id });
            if (selectedClass) {
                try {
                    await api.delete(`/classes/${selectedClass.id}/students/${studentToMove.id}`);
                } catch (ignore) { /* Ignore */ }
            }
            toast.success('Student moved successfully');
            setIsMoveStudentOpen(false);
            if (selectedClass) fetchStudentsForClass(selectedClass.id);
        } catch (e) {
            toast.error('Failed to move student');
        }
    };

    const handleDeleteStudent = async (studentId: string) => {
        if (!confirm('Remove student from this class? They will be moved to the Unenrolled list.')) return;
        if (!selectedClass) return;
        try {
            await api.delete(`/classes/${selectedClass.id}/students/${studentId}`);
            toast.success('Student removed from class');
            fetchStudentsForClass(selectedClass.id);
        } catch (e) {
            toast.error('Failed to remove student');
        }
    };

    const handleDeletePermanently = async (studentId: string) => {
        if (!confirm('⚠️ PERMANENTLY DELETE student? This will remove all records including grades and payments. This cannot be undone.')) return;
        try {
            await api.delete(`/students/${studentId}`);
            toast.success('Student deleted permanently');
            // Refresh current view
            if (view === 'unenrolled') fetchUnenrolledStudents();
            else if (selectedClass) fetchStudentsForClass(selectedClass.id);
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Failed to delete student');
        }
    };

    const handleBack = () => {
        if (view === 'students') setView('sections');
        else if (view === 'sections') setView('grades');
    };

    // --- RENDERERS ---

    const renderGrades = () => {
        return (
            <div className="space-y-8">
                {/* Special Folders */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div
                        onClick={() => {
                            setView('unenrolled');
                            fetchUnenrolledStudents();
                        }}
                        className="p-6 bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 rounded-2xl shadow-sm hover:shadow-md cursor-pointer transition-all flex items-center justify-between group relative overflow-hidden"
                    >
                        <div className="relative z-10 flex items-center gap-4">
                            <div className="p-3 bg-white text-indigo-600 rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                                <UserPlus size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 text-lg group-hover:text-indigo-700 transition-colors">Unenrolled / New</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                    <p className="text-slate-500 text-sm font-medium">Action Required</p>
                                </div>
                            </div>
                        </div>
                        <ArrowRight className="text-indigo-300 group-hover:text-indigo-600 transition-colors relative z-10" />

                        {/* Background Deco */}
                        <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-100/50 rounded-full blur-3xl -translate-y-16 translate-x-16" />
                    </div>
                </div>

                {/* Dynamic Grade Levels */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-lg font-bold text-slate-700 flex items-center gap-2">
                                <GraduationCap size={20} className="text-indigo-600" />
                                Academic Levels
                            </h2>
                            <p className="text-sm text-slate-500">Select a grade to view sections</p>
                        </div>
                        <button
                            onClick={() => setIsManageLevelsOpen(true)}
                            className="bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-slate-50 hover:text-indigo-600 transition-colors flex items-center gap-2"
                        >
                            <TrendingUp size={16} /> Manage Levels
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {gradeLevels.map((l) => (
                            <FolderItem
                                key={l.id}
                                label={l.label}
                                subLabel={l.category}
                                count={classes.filter(c => c.name.includes(l.label) || c.name.startsWith(l.value.toString())).length}
                                color={l.category?.includes('College') ? 'text-purple-500' : l.value > 6 ? 'text-indigo-500' : 'text-emerald-500'}
                                variant="glass"
                                onClick={() => {
                                    setSelectedGrade(l.value);
                                    setView('sections');
                                }}
                            />
                        ))}

                        {/* Add New Quick Button in Grid */}
                        <div
                            onClick={() => setIsManageLevelsOpen(true)}
                            className="border-2 border-dashed border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center text-slate-400 cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/10 hover:text-indigo-500 transition-all group min-h-[100px]"
                        >
                            <div className="w-10 h-10 rounded-full bg-slate-50 group-hover:bg-indigo-100 flex items-center justify-center mb-2 transition-colors">
                                <Plus size={20} />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-wider">Add Level</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderSections = () => {
        if (isLoading) return (
            <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                <div className="w-16 h-16 bg-indigo-100 rounded-full mb-4" />
                <div className="h-4 w-48 bg-slate-200 rounded mb-2" />
                <div className="h-3 w-32 bg-slate-100 rounded" />
            </div>
        );

        return (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Create Section Button */}
                <div className="flex justify-end mb-8">
                    <button
                        onClick={() => setIsCreateSectionOpen(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-200 hover:shadow-xl hover:scale-105 transition-all font-bold"
                    >
                        <Plus size={20} /> Create New Section
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {classes.map(c => (
                        <div key={c.id} className="relative group">
                            <FolderItem
                                label={c.name}
                                subLabel={`${c.teacher?.firstName || 'No'} Teacher`}
                                color={c.name.includes('A') ? "text-emerald-500" : c.name.includes('B') ? "text-indigo-500" : "text-amber-500"}
                                count={c._count?.students || Math.floor(Math.random() * 30) + 10} // Mock count if missing
                                variant="glass"
                                onClick={() => {
                                    setSelectedClass(c);
                                    setView('students');
                                }}
                            />

                            {/* Floating Action Button for Delete */}
                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                <button
                                    onClick={(e) => handleDeleteSection(e, c.id)}
                                    className="p-2 bg-white text-rose-500 rounded-lg shadow-sm hover:bg-rose-50 border border-slate-100 hover:border-rose-200 transition-colors"
                                    title="Delete Section"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                    {classes.length === 0 && (
                        <div className="col-span-full border-2 border-dashed border-slate-200 rounded-2xl p-12 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                                <Folder size={32} className="text-slate-300" />
                            </div>
                            <p className="font-bold text-lg text-slate-600">No sections found</p>
                            <p className="text-sm">Get started by creating a section for Grade {selectedGrade}</p>
                            <button onClick={() => setIsCreateSectionOpen(true)} className="mt-4 text-indigo-600 font-bold hover:underline flex items-center gap-2">
                                <Plus size={16} /> Create Section
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderStudentList = () => {
        if (isLoading) return (
            <div className="p-12 text-center pb-32">
                <Users className="w-16 h-16 text-slate-200 mx-auto mb-4 animate-bounce" />
                <p className="text-slate-500 font-medium">Loading Student Roster...</p>
            </div>
        );

        return (
            <Card className="border-0 shadow-lg ring-1 ring-slate-100 bg-white/50 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 bg-white/50 pb-6">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-xl">
                            <Users className="text-indigo-600" size={24} />
                            Students in <span className="text-indigo-600">{selectedClass?.name}</span>
                        </CardTitle>
                        <p className="text-sm text-slate-500 mt-1">Manage enrollment, credentials, and records</p>
                    </div>

                    <div className="flex gap-3">
                        <div className="relative group">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search by name or ID..."
                                className="pl-10 h-10 w-64 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all shadow-sm"
                            />
                        </div>

                        {students.length > 0 && (
                            <button
                                onClick={() => setIsClassCredentialModalOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 rounded-xl hover:bg-slate-50 shadow-sm ring-1 ring-slate-200 border-0 font-bold transition-all"
                            >
                                <FileText size={18} /> Credentials
                            </button>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto w-full">
                        <table className="w-full text-sm text-left min-w-[800px]">
                            <thead className="bg-slate-50/50 text-slate-500 font-bold uppercase text-xs tracking-wider border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4">Student Profile</th>
                                    <th className="px-6 py-4">Student ID</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Quick Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {students.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="p-16 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
                                                    <Users size={32} className="text-indigo-300" />
                                                </div>
                                                <h3 className="text-lg font-bold text-slate-700">No Students Found</h3>
                                                <p className="text-slate-500 mb-6 max-w-sm">This class is currently empty. Start by adding students or importing from another section.</p>
                                                <button onClick={() => setIsAddStudentOpen(true)} className="text-indigo-600 font-bold hover:underline">
                                                    Add First Student
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ) : students.map((s, i) => (
                                    <tr key={s.id || i} className="group hover:bg-indigo-50/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="relative">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-sm ring-2 ring-white
                                                        ${['bg-rose-500', 'bg-indigo-500', 'bg-emerald-500', 'bg-amber-500'][i % 4]}`}>
                                                        {s.firstName?.[0]}
                                                    </div>
                                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white" />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-900 text-base">{s.firstName} {s.lastName}</div>
                                                    <div className="text-xs text-slate-500 flex items-center gap-1">
                                                        <User size={12} /> {s.user?.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-mono text-slate-600 bg-slate-100 px-2 py-1 rounded text-xs border border-slate-200">
                                                ID-{2024000 + i}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold border border-emerald-200">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                                                Enrolled
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => openIndividualCredentialModal(s)}
                                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                                    title="Credentials"
                                                >
                                                    <Key size={18} />
                                                </button>
                                                <button
                                                    onClick={() => setStudentToPrint({ ...s, idNumber: `ID-${2024000 + i}`, gradeLevel: selectedGrade, section: selectedClass.name })}
                                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                                    title="Print ID"
                                                >
                                                    <Printer size={18} />
                                                </button>
                                                <div className="w-px h-4 bg-slate-200 mx-1" />
                                                <button
                                                    onClick={() => { setTargetClassId(''); setStudentToMove(s); setIsMoveStudentOpen(true); }}
                                                    className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                                    title="Move"
                                                >
                                                    <GraduationCap size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteStudent(s.id)}
                                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                                    title="Remove"
                                                >
                                                    <Trash2 size={18} />
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
    };

    const renderUnenrolledList = () => {
        if (isLoading) return <div className="p-10 text-center">Loading Unenrolled Students...</div>;

        return (
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                            <UserPlus size={20} />
                        </div>
                        Unenrolled / New Admissions
                    </CardTitle>
                    <div className="flex gap-2">
                        <button onClick={() => setIsAddStudentOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-bold shadow-sm">
                            <Plus size={16} /> Register New Student
                        </button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-700 font-bold uppercase">
                                <tr>
                                    <th className="px-4 py-3 rounded-l-lg">Student</th>
                                    <th className="px-4 py-3">Register Date</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3 rounded-r-lg text-right">Placement</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {students.length === 0 ? (
                                    <tr><td colSpan={4} className="p-8 text-center text-slate-500">No unenrolled students found. All caught up!</td></tr>
                                ) : students.map((s, i) => (
                                    <tr key={s.id || i} className="hover:bg-slate-50/50">
                                        <td className="px-4 py-3 flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500">
                                                {s.firstName?.[0]}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-900">{s.firstName} {s.lastName}</div>
                                                <div className="text-xs text-slate-500">{s.user?.email}</div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-slate-500">{new Date(s.user?.createdAt || Date.now()).toLocaleDateString()}</td>
                                        <td className="px-4 py-3">
                                            <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold flex w-fit items-center gap-1">
                                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                                Unenrolled
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button
                                                onClick={() => { setTargetClassId(''); setStudentToMove(s); setIsMoveStudentOpen(true); }}
                                                className="px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg font-bold text-xs transition-colors border border-indigo-200"
                                            >
                                                Enroll / Assign Class
                                            </button>
                                            <button
                                                onClick={() => handleDeletePermanently(s.id)}
                                                className="px-2 py-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100"
                                                title="Delete Permanently"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        );
    };

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto animate-in fade-in duration-500 pb-20">
            {/* STATS RIBBON */}
            <StatsRibbon />
            {/* Breadcrumb / Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    {view !== 'grades' && (
                        <button onClick={handleBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                            <ArrowLeft size={24} className="text-slate-600" />
                        </button>
                    )}
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                            {view === 'grades' ? 'Student Manager' :
                                view === 'sections' ? `Grade ${selectedGrade} Sections` :
                                    view === 'unenrolled' ? 'Unenrolled Students' :
                                        'Student List'}
                        </h1>
                        <p className="text-slate-500">
                            {view === 'grades' ? 'Select a grade level to view sections' :
                                view === 'sections' ? 'Select a class section to manage students' :
                                    view === 'unenrolled' ? 'Students pending class placement' :
                                        `Managing students in ${selectedClass?.name}`}
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => {
                        setSelectedClass(null); // Ensure no class is selected for "Unenrolled" add
                        setIsAddStudentOpen(true);
                    }}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-200 transition-all active:scale-95"
                >
                    <UserPlus size={20} />
                    <span>Register Student</span>
                </button>
            </div>

            <div className="min-h-[500px]">
                {view === 'grades' && renderGrades()}
                {view === 'sections' && renderSections()}
                {view === 'unenrolled' && renderUnenrolledList()}
                {view === 'students' && renderStudentList()}
            </div>

            {/* Hidden Print Components */}
            <div style={{ display: 'none' }}>
                <IDCardTemplate
                    ref={idCardRef}
                    user={studentToPrint || { id: '', firstName: '', lastName: '', role: 'Student', idNumber: '' }}
                    variant="student"
                />
                {credentialsToPrint && (
                    <CredentialSlip
                        ref={credentialSlipRef}
                        studentName={credentialsToPrint.studentName}
                        email={credentialsToPrint.email}
                        password={credentialsToPrint.password}
                    />
                )}
                {classCredentialsToPrint && (
                    <ClassCredentialSlips
                        ref={classCredentialSlipRef}
                        className={classCredentialsToPrint.className}
                        students={classCredentialsToPrint.students}
                    />
                )}
            </div>
            {/* Manage Grade Levels Modal */}
            <ManageGradeLevelsModal
                isOpen={isManageLevelsOpen}
                onClose={() => setIsManageLevelsOpen(false)}
                onUpdate={fetchGradeLevels}
            />

            {/* Other Modals */}
            {isCreateSectionOpen && (
                <Modal isOpen={isCreateSectionOpen} onClose={() => setIsCreateSectionOpen(false)} title="Create New Section">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Section Name</label>
                            <div className="flex items-center">
                                <span className="px-3 py-2 bg-slate-100 border border-r-0 border-slate-300 rounded-l-md text-slate-500 text-sm">
                                    Grade {selectedGrade} -
                                </span>
                                <input
                                    type="text"
                                    value={sectionName}
                                    onChange={(e) => setSectionName(e.target.value)}
                                    placeholder="e.g. Rizal"
                                    className="flex-1 p-2 border border-slate-300 rounded-r-md focus:ring-2 focus:ring-indigo-500 outline-none"
                                    autoFocus
                                />
                            </div>
                        </div>
                        <button onClick={handleCreateSection} className="w-full py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700">
                            Create Section
                        </button>
                    </div>
                </Modal>
            )}

            {/* UNIFIED ADD STUDENT MODAL */}
            <AddStudentModal
                isOpen={isAddStudentOpen}
                onClose={() => setIsAddStudentOpen(false)}
                currentClass={selectedClass}
                onStudentAdded={() => {
                    if (selectedClass) fetchStudentsForClass(selectedClass.id);
                    else if (view === 'unenrolled') fetchUnenrolledStudents();
                }}
            />



            {/* Individual Credential Modal - Premium Redesign */}
            <Modal isOpen={isCredentialModalOpen} onClose={() => setIsCredentialModalOpen(false)} title="Credential Management">
                <div className="space-y-6">
                    {/* Header Info */}
                    <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-2xl shadow-sm">
                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                            <Key className="text-slate-500" size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-0.5">Account Owner</p>
                            <h3 className="font-bold text-slate-800 text-lg">{studentForCredentials?.firstName} {studentForCredentials?.lastName}</h3>
                            <p className="text-sm font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded inline-block mt-1">
                                {studentForCredentials?.user?.email}
                            </p>
                        </div>
                    </div>

                    <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-6 hover:border-indigo-300 transition-colors">
                        <label className="flex items-start gap-4 cursor-pointer group">
                            <div className={`mt-0.5 w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${resetToDefault ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300 group-hover:border-indigo-400'}`}>
                                {resetToDefault && <div className="text-white">✓</div>}
                            </div>
                            <input
                                type="checkbox"
                                className="hidden"
                                checked={resetToDefault}
                                onChange={(e) => setResetToDefault(e.target.checked)}
                            />
                            <div className="flex-1">
                                <span className={`block font-bold text-base transition-colors ${resetToDefault ? 'text-indigo-700' : 'text-slate-700'}`}>
                                    Reset Password & Print
                                </span>
                                <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                                    Securely resets the student's password to <span className="font-mono bg-slate-100 px-1 rounded text-slate-700 font-bold">Student123</span> and prints a new credential slip.
                                </p>
                                <div className={`text-xs mt-2 font-medium flex items-center gap-1.5 ${resetToDefault ? 'text-indigo-600' : 'text-slate-400'}`}>
                                    <div className={`w-1.5 h-1.5 rounded-full ${resetToDefault ? 'bg-indigo-600 animate-pulse' : 'bg-slate-300'}`} />
                                    {resetToDefault ? 'Ready to reset and print' : 'Password hidden for security (Username Only)'}
                                </div>
                            </div>
                        </label>
                    </div>

                    <div className="pt-2 flex justify-end gap-3">
                        <button
                            onClick={() => setIsCredentialModalOpen(false)}
                            className="px-5 py-2.5 text-slate-600 hover:bg-slate-50 hover:text-slate-800 rounded-xl font-medium transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handlePrintIndividualCredentials}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold shadow-lg transition-all active:scale-95 ${resetToDefault
                                ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'
                                : 'bg-slate-800 text-white hover:bg-slate-900 shadow-slate-200'
                                }`}
                        >
                            <Printer size={18} />
                            {resetToDefault ? 'Confirmed: Reset & Print' : 'Print Slip (Username Only)'}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Class Bulk Credential Modal */}
            < Modal isOpen={isClassCredentialModalOpen} onClose={() => setIsClassCredentialModalOpen(false)} title="Print Class Credentials" >
                <div className="space-y-4">
                    <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                        <p className="text-sm text-indigo-800 font-medium">Bulk Printing for {students.length} Students</p>
                        <p className="text-xs text-indigo-700 mt-1">This will generate a grid of printable slips for the entire class.</p>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-lg border">
                        <label className="flex items-start gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                className="mt-1 w-5 h-5 text-indigo-600 rounded border-slate-300"
                                checked={showDefaultPassword}
                                onChange={(e) => setShowDefaultPassword(e.target.checked)}
                            />
                            <div>
                                <span className="block font-bold text-slate-800">Show 'Student123' as password?</span>
                                <span className="block text-xs text-slate-500 mt-1">Useful if mass-onboarding new students with default passwords. If unchecked, the password field will be blank.</span>
                            </div>
                        </label>
                    </div>

                    <div className="pt-2 flex justify-end gap-3">
                        <button onClick={() => setIsClassCredentialModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                        <button onClick={handlePrintClassCredentialsList} className="flex items-center gap-2 px-6 py-2 bg-slate-800 text-white font-bold rounded-lg hover:bg-slate-900">
                            <Printer size={18} /> Generate & Print
                        </button>
                    </div>
                </div>
            </Modal >

            {/* Move/Promote Student Modal */}
            <Modal
                isOpen={isMoveStudentOpen}
                onClose={() => setIsMoveStudentOpen(false)}
                title={view === 'unenrolled' ? "Class Placement" : "Move / Promote Student"}
            >
                <div className="space-y-4">
                    <div className="p-3 bg-slate-50 rounded-lg border">
                        <span className="text-xs text-slate-500 uppercase font-bold">Student</span>
                        <div className="font-bold text-lg text-indigo-700">{studentToMove?.firstName} {studentToMove?.lastName}</div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Target Grade Level</label>
                        <select
                            className="w-full p-2 border border-slate-300 rounded-lg"
                            value={targetGrade}
                            onChange={(e) => setTargetGrade(Number(e.target.value))}
                        >
                            {[...Array(12)].map((_, i) => (
                                <option key={i + 1} value={i + 1}>Grade {i + 1}</option>
                            ))}
                            {/* Simple college implementation */}
                            <option value={13}>College Year 1</option>
                            <option value={14}>College Year 2</option>
                            <option value={15}>College Year 3</option>
                            <option value={16}>College Year 4</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Target Section</label>
                        <select
                            className="w-full p-2 border border-slate-300 rounded-lg"
                            value={targetClassId}
                            onChange={(e) => setTargetClassId(e.target.value)}
                        >
                            <option value="">-- Select Section --</option>
                            {classes.length === 0 && <option disabled>No sections found for this grade</option>}
                            {classes.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={handleMoveStudent}
                        disabled={!targetClassId}
                        className="w-full py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {view === 'unenrolled' ? "Confirm Placement" : "Confirm Move"}
                    </button>
                </div>
            </Modal>
        </div >
    );
};
