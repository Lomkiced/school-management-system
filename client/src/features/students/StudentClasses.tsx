// FILE: client/src/features/students/StudentClasses.tsx
// 2026 Standard: Student's enrolled classes with LMS access

import {
    Book,
    BookOpen,
    ChevronRight,
    ClipboardList,
    FileText,
    GraduationCap,
    Loader2,
    MessageSquare,
    User,
    X
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import api from '../../lib/axios';

interface EnrolledClass {
    id: string;
    class: {
        id: string;
        name: string;
        teacher?: {
            firstName: string;
            lastName: string;
        } | null;
        subject?: {
            id: string;
            name: string;
            code: string;
        } | null;
        _count?: {
            enrollments: number;
            assignments?: number;
            materials?: number;
        };
    };
    enrolledAt: string;
}

export const StudentClasses = () => {
    const navigate = useNavigate();
    const [enrollments, setEnrollments] = useState<EnrolledClass[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchClasses = async () => {
            try {
                setLoading(true);
                const res = await api.get('/portal/my-classes');
                if (res.data.success) {
                    setEnrollments(res.data.data);
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
                        <GraduationCap className="h-8 w-8 text-indigo-600" />
                        My Classes
                    </h1>
                    <p className="text-slate-500 mt-1">
                        Access your enrolled classes, materials, and quizzes
                    </p>
                </div>
                <div className="bg-indigo-50 px-4 py-2 rounded-xl flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-indigo-600" />
                    <span className="font-semibold text-indigo-700">{enrollments.length}</span>
                    <span className="text-indigo-600">classes enrolled</span>
                </div>
            </div>

            {/* Empty State */}
            {enrollments.length === 0 && (
                <Card className="border-dashed border-2 border-slate-200">
                    <CardContent className="py-16 text-center">
                        <Book className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-xl font-medium text-slate-700">No Classes Yet</h3>
                        <p className="text-slate-500 mt-2 max-w-md mx-auto">
                            You haven't been enrolled in any classes yet. Please contact your administrator.
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Classes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {enrollments.map((enrollment) => (
                    <Card
                        key={enrollment.id}
                        className="group hover:shadow-lg transition-all duration-300 border-slate-200 hover:border-indigo-300 cursor-pointer overflow-hidden"
                        onClick={() => navigate(`/student/class/${enrollment.class.id}`)}
                    >
                        {/* Color Bar */}
                        <div className="h-2 bg-gradient-to-r from-indigo-500 to-purple-500" />

                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center justify-between">
                                <span className="text-lg">{enrollment.class.name}</span>
                                <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                            </CardTitle>
                            <CardDescription className="flex items-center gap-2">
                                {enrollment.class.subject ? (
                                    <>
                                        <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded">
                                            {enrollment.class.subject.code}
                                        </span>
                                        <span>{enrollment.class.subject.name}</span>
                                    </>
                                ) : (
                                    <span className="italic">No subject</span>
                                )}
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            {/* Teacher */}
                            {enrollment.class.teacher && (
                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                    <User className="h-4 w-4 text-slate-400" />
                                    <span>
                                        {enrollment.class.teacher.firstName} {enrollment.class.teacher.lastName}
                                    </span>
                                </div>
                            )}

                            {/* Stats */}
                            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
                                <div className="text-center">
                                    <div className="flex items-center justify-center gap-1 text-slate-400 mb-1">
                                        <FileText className="h-3.5 w-3.5" />
                                    </div>
                                    <p className="text-xs text-slate-500">Materials</p>
                                </div>
                                <div className="text-center">
                                    <div className="flex items-center justify-center gap-1 text-slate-400 mb-1">
                                        <ClipboardList className="h-3.5 w-3.5" />
                                    </div>
                                    <p className="text-xs text-slate-500">Quizzes</p>
                                </div>
                                <div className="text-center">
                                    <div className="flex items-center justify-center gap-1 text-slate-400 mb-1">
                                        <MessageSquare className="h-3.5 w-3.5" />
                                    </div>
                                    <p className="text-xs text-slate-500">Chat</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default StudentClasses;
