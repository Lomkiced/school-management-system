// FILE: client/src/features/teachers/TeacherGradebook.tsx
// 2026 Standard: Teacher's gradebook overview - list of all classes for grading

import {
    ArrowRight,
    ClipboardList,
    GraduationCap,
    Loader2,
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
        grades: number;
    };
}

export const TeacherGradebook = () => {
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
                setError(err.response?.data?.message || 'Failed to load classes');
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
                    <p className="text-slate-500">Loading gradebook...</p>
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
                        <ClipboardList className="h-8 w-8 text-indigo-600" />
                        Gradebook
                    </h1>
                    <p className="text-slate-500 mt-1">
                        Select a class to view and manage student grades
                    </p>
                </div>
            </div>

            {/* Empty State */}
            {classes.length === 0 && (
                <Card className="border-dashed border-2 border-slate-200">
                    <CardContent className="py-16 text-center">
                        <ClipboardList className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-xl font-medium text-slate-700">No Classes Assigned</h3>
                        <p className="text-slate-500 mt-2 max-w-md mx-auto">
                            You haven't been assigned to any classes yet.
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Classes Table */}
            {classes.length > 0 && (
                <Card className="shadow-lg">
                    <CardHeader className="border-b bg-slate-50">
                        <CardTitle className="text-lg">Select a Class</CardTitle>
                        <CardDescription>Click on a class to open its gradebook</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y">
                            {classes.map((cls) => (
                                <div
                                    key={cls.id}
                                    className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors cursor-pointer group"
                                    onClick={() => navigate(`/teacher/grading/${cls.id}`)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="bg-indigo-100 p-3 rounded-lg group-hover:bg-indigo-200 transition-colors">
                                            <GraduationCap className="h-6 w-6 text-indigo-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                                {cls.name}
                                            </h3>
                                            <p className="text-sm text-slate-500">
                                                {cls.subject ? (
                                                    <>
                                                        <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded mr-2">
                                                            {cls.subject.code}
                                                        </span>
                                                        {cls.subject.name}
                                                    </>
                                                ) : (
                                                    <span className="italic">No subject assigned</span>
                                                )}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <div className="flex items-center gap-1 text-slate-500">
                                                <Users className="h-4 w-4" />
                                                <span className="font-medium">{cls._count?.enrollments || 0}</span>
                                            </div>
                                            <p className="text-xs text-slate-400">students</p>
                                        </div>
                                        <Button variant="ghost" size="sm" className="group-hover:bg-indigo-100">
                                            <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-indigo-600" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default TeacherGradebook;
