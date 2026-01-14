// FILE: client/src/features/teachers/TeacherClasses.tsx
// 2026 Standard: Teacher's class list with LMS access

import {
    ArrowRight,
    BookOpen,
    ClipboardList,
    FileText,
    GraduationCap,
    Loader2,
    MessageSquare,
    Play,
    Upload,
    Users,
    X
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import api from '../../lib/axios';

interface TeacherClass {
    id: string;
    name: string;
    subject?: {
        id: string;
        name: string;
        code: string;
    } | null;
    _count?: {
        enrollments: number;
    };
}

export const TeacherClasses = () => {
    const navigate = useNavigate();
    const [classes, setClasses] = useState<TeacherClass[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchClasses = async () => {
            try {
                setLoading(true);
                const res = await api.get('/teacher-portal/classes');
                if (res.data.success || Array.isArray(res.data.data)) {
                    setClasses(res.data.data || []);
                }
            } catch (err: any) {
                console.error('Failed to fetch classes:', err);
                setError(err.response?.data?.message || 'Failed to load your classes');
                toast.error('Failed to load classes');
            } finally {
                setLoading(false);
            }
        };

        fetchClasses();
    }, []);

    if (loading) {
        return (
            <div className="h-[calc(100vh-200px)] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
                    <p className="text-slate-500">Loading your classes...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-md mx-auto mt-20">
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="pt-6 text-center">
                        <X className="h-12 w-12 text-red-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-red-900">{error}</h3>
                        <Button className="mt-4" onClick={() => window.location.reload()}>
                            Try Again
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                        <BookOpen className="h-8 w-8 text-indigo-600" />
                        My Classes
                    </h1>
                    <p className="text-slate-500 mt-1">
                        Manage your classes, materials, and student grades
                    </p>
                </div>
                <div className="bg-indigo-50 px-4 py-2 rounded-xl flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-indigo-600" />
                    <span className="font-semibold text-indigo-700">{classes.length}</span>
                    <span className="text-indigo-600">classes assigned</span>
                </div>
            </div>

            {/* Empty State */}
            {classes.length === 0 && (
                <Card className="border-dashed border-2 border-slate-200">
                    <CardContent className="py-16 text-center">
                        <BookOpen className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-xl font-medium text-slate-700">No Classes Assigned</h3>
                        <p className="text-slate-500 mt-2 max-w-md mx-auto">
                            You haven't been assigned to any classes yet. Please contact the administrator.
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Classes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {classes.map((cls) => (
                    <Card
                        key={cls.id}
                        className="group hover:shadow-lg transition-all duration-300 border-slate-200 hover:border-indigo-300 overflow-hidden"
                    >
                        {/* Color Bar */}
                        <div className="h-2 bg-gradient-to-r from-indigo-500 to-purple-500" />

                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center justify-between">
                                <span className="text-lg">{cls.name}</span>
                                <div className="flex items-center gap-1 text-sm text-slate-500">
                                    <Users className="h-4 w-4" />
                                    {cls._count?.enrollments || 0}
                                </div>
                            </CardTitle>
                            <CardDescription className="flex items-center gap-2">
                                {cls.subject ? (
                                    <>
                                        <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded">
                                            {cls.subject.code}
                                        </span>
                                        <span>{cls.subject.name}</span>
                                    </>
                                ) : (
                                    <span className="italic">No subject</span>
                                )}
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            {/* Quick Actions */}
                            <div className="grid grid-cols-2 gap-2">
                                <Button
                                    size="sm"
                                    className="bg-indigo-600 hover:bg-indigo-700"
                                    onClick={() => navigate(`/teacher/grading/${cls.id}`)}
                                >
                                    <ClipboardList className="h-4 w-4 mr-1" />
                                    Gradebook
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => navigate(`/teacher/class/${cls.id}`)}
                                >
                                    <ArrowRight className="h-4 w-4 mr-1" />
                                    View Class
                                </Button>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-4 gap-2 pt-3 border-t border-slate-100">
                                <div className="text-center cursor-pointer hover:text-indigo-600 transition-colors"
                                    onClick={() => navigate(`/teacher/class/${cls.id}?tab=materials`)}>
                                    <FileText className="h-4 w-4 mx-auto text-slate-400" />
                                    <p className="text-xs text-slate-500 mt-1">Materials</p>
                                </div>
                                <div className="text-center cursor-pointer hover:text-indigo-600 transition-colors"
                                    onClick={() => navigate(`/teacher/class/${cls.id}?tab=assignments`)}>
                                    <Upload className="h-4 w-4 mx-auto text-slate-400" />
                                    <p className="text-xs text-slate-500 mt-1">Assign</p>
                                </div>
                                <div className="text-center cursor-pointer hover:text-indigo-600 transition-colors"
                                    onClick={() => navigate(`/teacher/class/${cls.id}/quiz/new`)}>
                                    <Play className="h-4 w-4 mx-auto text-slate-400" />
                                    <p className="text-xs text-slate-500 mt-1">Quiz</p>
                                </div>
                                <div className="text-center cursor-pointer hover:text-indigo-600 transition-colors"
                                    onClick={() => navigate(`/teacher/class/${cls.id}?tab=chat`)}>
                                    <MessageSquare className="h-4 w-4 mx-auto text-slate-400" />
                                    <p className="text-xs text-slate-500 mt-1">Chat</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default TeacherClasses;
