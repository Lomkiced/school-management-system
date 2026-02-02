// FILE: client/src/components/teachers/TeacherSelector.tsx
// 2026 Standard: Advanced Teacher Selection Modal with Workload Visualization

import {
    AlertCircle,
    BookOpen,
    Briefcase,
    Check,
    ChevronDown,
    Loader2,
    Search,
    Sparkles,
    User,
    Users,
    X
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

// Types
export interface TeacherWithWorkload {
    id: string;
    firstName: string;
    lastName: string;
    phone?: string | null;
    department?: {
        id: string;
        name: string;
        code?: string | null;
    } | null;
    classCount: number;
    studentCount: number;
    weeklyHours: number;
    maxWeeklyHours: number;
    workloadPercentage: number;
    availabilityStatus: 'available' | 'busy' | 'at_capacity';
    classes?: Array<{ id: string; name: string }>;
}

interface TeacherSelectorProps {
    teachers: TeacherWithWorkload[];
    selectedTeacherId?: string | null;
    onSelect: (teacher: TeacherWithWorkload | null) => void;
    isLoading?: boolean;
}

// Workload Progress Bar Component
const WorkloadBar = ({ percentage, status }: { percentage: number; status: string }) => {
    const getColor = () => {
        switch (status) {
            case 'at_capacity': return 'bg-gradient-to-r from-red-500 to-rose-500';
            case 'busy': return 'bg-gradient-to-r from-amber-500 to-orange-500';
            default: return 'bg-gradient-to-r from-emerald-500 to-green-500';
        }
    };

    return (
        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
                className={`h-full ${getColor()} transition-all duration-500 ease-out`}
                style={{ width: `${Math.min(percentage, 100)}%` }}
            />
        </div>
    );
};

// Status Badge Component
const StatusBadge = ({ status }: { status: string }) => {
    const config = {
        available: {
            label: 'Available',
            className: 'bg-emerald-100 text-emerald-700 border-emerald-200'
        },
        busy: {
            label: 'Busy',
            className: 'bg-amber-100 text-amber-700 border-amber-200'
        },
        at_capacity: {
            label: 'At Capacity',
            className: 'bg-red-100 text-red-700 border-red-200'
        }
    }[status] || { label: 'Unknown', className: 'bg-slate-100 text-slate-700' };

    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${config.className}`}>
            {config.label}
        </span>
    );
};

// Avatar Component
const TeacherAvatar = ({ firstName, lastName, size = 'md' }: { firstName: string; lastName: string; size?: 'sm' | 'md' | 'lg' }) => {
    const sizeClasses = {
        sm: 'h-8 w-8 text-xs',
        md: 'h-12 w-12 text-sm',
        lg: 'h-16 w-16 text-lg'
    };

    const colors = [
        'from-indigo-500 to-purple-500',
        'from-emerald-500 to-teal-500',
        'from-amber-500 to-orange-500',
        'from-rose-500 to-pink-500',
        'from-cyan-500 to-blue-500'
    ];

    const colorIndex = (firstName.charCodeAt(0) + lastName.charCodeAt(0)) % colors.length;

    return (
        <div className={`${sizeClasses[size]} rounded-xl bg-gradient-to-br ${colors[colorIndex]} flex items-center justify-center text-white font-semibold shadow-lg`}>
            {firstName[0]}{lastName[0]}
        </div>
    );
};

// Teacher Card Component
const TeacherCard = ({
    teacher,
    isSelected,
    isRecommended,
    onClick
}: {
    teacher: TeacherWithWorkload;
    isSelected: boolean;
    isRecommended: boolean;
    onClick: () => void;
}) => {
    return (
        <div
            onClick={onClick}
            className={`
        relative p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300
        backdrop-blur-sm bg-white/80
        hover:shadow-lg hover:scale-[1.02] hover:-translate-y-1
        ${isSelected
                    ? 'border-indigo-500 bg-indigo-50/80 ring-4 ring-indigo-100'
                    : 'border-slate-200 hover:border-indigo-300'
                }
        ${teacher.availabilityStatus === 'at_capacity' ? 'opacity-60' : ''}
      `}
        >
            {/* Recommended Badge */}
            {isRecommended && (
                <div className="absolute -top-2 -right-2 flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-amber-400 to-orange-400 text-white text-xs font-semibold rounded-full shadow-lg">
                    <Sparkles className="h-3 w-3" />
                    Recommended
                </div>
            )}

            {/* Selection Check */}
            {isSelected && (
                <div className="absolute top-3 right-3 h-6 w-6 bg-indigo-500 rounded-full flex items-center justify-center">
                    <Check className="h-4 w-4 text-white" />
                </div>
            )}

            <div className="flex gap-4">
                <TeacherAvatar firstName={teacher.firstName} lastName={teacher.lastName} />

                <div className="flex-1 min-w-0">
                    {/* Name & Department */}
                    <h3 className="font-semibold text-slate-900 truncate">
                        {teacher.lastName}, {teacher.firstName}
                    </h3>
                    {teacher.department && (
                        <p className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
                            <Briefcase className="h-3 w-3" />
                            {teacher.department.name}
                        </p>
                    )}

                    {/* Stats Row */}
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-600">
                        <span className="flex items-center gap-1">
                            <BookOpen className="h-3 w-3" />
                            {teacher.classCount} classes
                        </span>
                        <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {teacher.studentCount} students
                        </span>
                    </div>

                    {/* Workload Bar */}
                    <div className="mt-3">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-xs text-slate-500">Workload</span>
                            <span className="text-xs font-medium text-slate-700">
                                {teacher.weeklyHours}/{teacher.maxWeeklyHours}h
                            </span>
                        </div>
                        <WorkloadBar
                            percentage={teacher.workloadPercentage}
                            status={teacher.availabilityStatus}
                        />
                    </div>

                    {/* Status Badge */}
                    <div className="mt-2">
                        <StatusBadge status={teacher.availabilityStatus} />
                    </div>
                </div>
            </div>
        </div>
    );
};

// Main Component
export const TeacherSelector = ({
    teachers,
    selectedTeacherId,
    onSelect,
    isLoading
}: TeacherSelectorProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterDepartment, setFilterDepartment] = useState<string>('all');

    // Get unique departments
    const departments = useMemo(() => {
        const depts = teachers
            .filter(t => t.department)
            .map(t => t.department!)
            .filter((dept, index, self) =>
                index === self.findIndex(d => d.id === dept.id)
            );
        return depts;
    }, [teachers]);

    // Filter and sort teachers
    const filteredTeachers = useMemo(() => {
        let result = [...teachers];

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(t =>
                t.firstName.toLowerCase().includes(query) ||
                t.lastName.toLowerCase().includes(query) ||
                t.department?.name.toLowerCase().includes(query)
            );
        }

        // Status filter
        if (filterStatus !== 'all') {
            result = result.filter(t => t.availabilityStatus === filterStatus);
        }

        // Department filter
        if (filterDepartment !== 'all') {
            result = result.filter(t => t.department?.id === filterDepartment);
        }

        // Sort: Available first, then by workload (ascending)
        result.sort((a, b) => {
            const statusOrder = { available: 0, busy: 1, at_capacity: 2 };
            const statusDiff = statusOrder[a.availabilityStatus] - statusOrder[b.availabilityStatus];
            if (statusDiff !== 0) return statusDiff;
            return a.workloadPercentage - b.workloadPercentage;
        });

        return result;
    }, [teachers, searchQuery, filterStatus, filterDepartment]);

    // Current selected teacher
    const selectedTeacher = teachers.find(t => t.id === selectedTeacherId);

    // Reset filters when closing
    useEffect(() => {
        if (!isOpen) {
            setSearchQuery('');
            setFilterStatus('all');
            setFilterDepartment('all');
        }
    }, [isOpen]);

    // Trigger Button Display
    const TriggerContent = () => {
        if (isLoading) {
            return (
                <div className="flex items-center gap-2 text-slate-400">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading teachers...
                </div>
            );
        }

        if (selectedTeacher) {
            return (
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3">
                        <TeacherAvatar
                            firstName={selectedTeacher.firstName}
                            lastName={selectedTeacher.lastName}
                            size="sm"
                        />
                        <div className="text-left">
                            <p className="font-medium text-slate-900">
                                {selectedTeacher.lastName}, {selectedTeacher.firstName}
                            </p>
                            {selectedTeacher.department && (
                                <p className="text-xs text-slate-500">{selectedTeacher.department.name}</p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <StatusBadge status={selectedTeacher.availabilityStatus} />
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onSelect(null);
                            }}
                            className="p-1 hover:bg-slate-200 rounded-full transition-colors"
                        >
                            <X className="h-4 w-4 text-slate-500" />
                        </button>
                    </div>
                </div>
            );
        }

        return (
            <div className="flex items-center gap-2 text-slate-500">
                <User className="h-4 w-4" />
                <span>Select a teacher...</span>
                <ChevronDown className="h-4 w-4 ml-auto" />
            </div>
        );
    };

    return (
        <div className="relative">
            {/* Trigger Button */}
            <div
                onClick={() => !isLoading && setIsOpen(true)}
                className={`
          w-full p-3 rounded-xl border-2 cursor-pointer transition-all duration-200
          ${selectedTeacher
                        ? 'border-indigo-200 bg-indigo-50/50'
                        : 'border-slate-200 bg-white hover:border-indigo-300'
                    }
          ${isLoading ? 'opacity-60 cursor-not-allowed' : ''}
        `}
            >
                <TriggerContent />
            </div>

            {/* Modal Overlay */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div
                        className="relative w-full max-w-3xl max-h-[85vh] bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="sticky top-0 z-10 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-bold">Assign Teacher</h2>
                                    <p className="text-indigo-100 text-sm mt-1">
                                        Select a teacher based on availability and workload
                                    </p>
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            {/* Search & Filters */}
                            <div className="flex flex-col sm:flex-row gap-3 mt-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-300" />
                                    <Input
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search teachers..."
                                        className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-indigo-200 focus:bg-white/20 focus:border-white/40"
                                    />
                                </div>

                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:bg-white/20"
                                >
                                    <option value="all" className="text-slate-900">All Status</option>
                                    <option value="available" className="text-slate-900">Available</option>
                                    <option value="busy" className="text-slate-900">Busy</option>
                                    <option value="at_capacity" className="text-slate-900">At Capacity</option>
                                </select>

                                {departments.length > 0 && (
                                    <select
                                        value={filterDepartment}
                                        onChange={(e) => setFilterDepartment(e.target.value)}
                                        className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:bg-white/20"
                                    >
                                        <option value="all" className="text-slate-900">All Departments</option>
                                        {departments.map(dept => (
                                            <option key={dept.id} value={dept.id} className="text-slate-900">
                                                {dept.name}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>
                        </div>

                        {/* Teacher Cards Grid */}
                        <div className="p-6 overflow-y-auto max-h-[60vh]">
                            {filteredTeachers.length === 0 ? (
                                <div className="text-center py-12">
                                    <AlertCircle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-slate-900">No teachers found</h3>
                                    <p className="text-slate-500 mt-1">
                                        {searchQuery
                                            ? 'Try adjusting your search or filters'
                                            : 'No teachers available in the system'
                                        }
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {filteredTeachers.map(teacher => (
                                        <TeacherCard
                                            key={teacher.id}
                                            teacher={teacher}
                                            isSelected={teacher.id === selectedTeacherId}
                                            isRecommended={
                                                teacher.availabilityStatus === 'available' &&
                                                teacher.workloadPercentage < 50
                                            }
                                            onClick={() => {
                                                onSelect(teacher);
                                                setIsOpen(false);
                                            }}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="sticky bottom-0 bg-slate-50 border-t px-6 py-4 flex justify-between items-center">
                            <p className="text-sm text-slate-500">
                                {filteredTeachers.length} teacher{filteredTeachers.length !== 1 ? 's' : ''} available
                            </p>
                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => setIsOpen(false)}
                                >
                                    Cancel
                                </Button>
                                {selectedTeacherId && (
                                    <Button
                                        onClick={() => {
                                            onSelect(null);
                                            setIsOpen(false);
                                        }}
                                        variant="outline"
                                        className="text-red-600 border-red-200 hover:bg-red-50"
                                    >
                                        Clear Selection
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeacherSelector;
