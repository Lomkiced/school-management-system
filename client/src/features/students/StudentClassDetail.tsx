// FILE: client/src/features/students/StudentClassDetail.tsx
// 2026 Standard: Student's class detail page with materials, assignments, quizzes, and chat

import {
    ArrowLeft,
    BookOpen,
    ClipboardCheck,
    Download,
    FileText,
    Link as LinkIcon,
    Loader2,
    MessageSquare,
    Play,
    Upload,
    User,
    X
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import api from '../../lib/axios';
import { ChatRoom } from '../chat/ChatRoom';

interface ClassInfo {
    id: string;
    name: string;
    teacher?: {
        firstName: string;
        lastName: string;
    } | null;
    subject?: {
        name: string;
        code: string;
    } | null;
}

interface Material {
    id: string;
    title: string;
    fileUrl: string;
    createdAt: string;
}

interface Assignment {
    id: string;
    title: string;
    description: string;
    dueDate: string;
    fileUrl?: string;
}

interface Quiz {
    id: string;
    title: string;
    description?: string;
    timeLimit?: number;
    _count?: {
        questions: number;
    };
}

export const StudentClassDetail = () => {
    const { classId } = useParams<{ classId: string }>();
    const navigate = useNavigate();

    const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
    const [materials, setMaterials] = useState<Material[]>([]);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('materials');

    useEffect(() => {
        const fetchClassData = async () => {
            if (!classId) return;

            try {
                setLoading(true);

                const [classRes, materialsRes, assignmentsRes, quizzesRes] = await Promise.all([
                    api.get(`/portal/class/${classId}`),
                    api.get(`/lms/class/${classId}/materials`),
                    api.get(`/lms/class/${classId}/assignments`),
                    api.get(`/lms/class/${classId}/quizzes`).catch(() => ({ data: { data: [] } }))
                ]);

                if (classRes.data.success) {
                    setClassInfo(classRes.data.data);
                }

                if (materialsRes.data.success) {
                    setMaterials(materialsRes.data.data);
                }

                if (assignmentsRes.data.success) {
                    setAssignments(assignmentsRes.data.data);
                }

                if (quizzesRes.data?.data) {
                    setQuizzes(quizzesRes.data.data);
                }

            } catch (err: any) {
                console.error('Failed to fetch class data:', err);
                setError(err.response?.data?.message || 'Failed to load class');
            } finally {
                setLoading(false);
            }
        };

        fetchClassData();
    }, [classId]);

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getFileIcon = (fileName: string) => {
        const ext = fileName.split('.').pop()?.toLowerCase();
        if (['pdf'].includes(ext || '')) return '📄';
        if (['doc', 'docx'].includes(ext || '')) return '📝';
        if (['ppt', 'pptx'].includes(ext || '')) return '📊';
        return '📁';
    };

    if (loading) {
        return (
            <div className="h-[calc(100vh-200px)] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
                    <p className="text-slate-500">Loading class...</p>
                </div>
            </div>
        );
    }

    if (error || !classInfo) {
        return (
            <div className="max-w-md mx-auto mt-20">
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="pt-6 text-center">
                        <X className="h-12 w-12 text-red-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-red-900">{error || 'Class not found'}</h3>
                        <Button className="mt-4" variant="outline" onClick={() => navigate('/student/classes')}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Classes
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="mb-2 -ml-2"
                        onClick={() => navigate('/student/classes')}
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Classes
                    </Button>
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                        <BookOpen className="h-8 w-8 text-indigo-600" />
                        {classInfo.name}
                    </h1>
                    <div className="flex items-center gap-4 mt-2">
                        {classInfo.subject && (
                            <span className="flex items-center gap-2 text-slate-600">
                                <span className="font-mono text-sm bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">
                                    {classInfo.subject.code}
                                </span>
                                {classInfo.subject.name}
                            </span>
                        )}
                        {classInfo.teacher && (
                            <span className="flex items-center gap-2 text-slate-500">
                                <User className="h-4 w-4" />
                                {classInfo.teacher.firstName} {classInfo.teacher.lastName}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Content Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="bg-slate-100 p-1">
                    <TabsTrigger value="materials" className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Materials ({materials.length})
                    </TabsTrigger>
                    <TabsTrigger value="assignments" className="flex items-center gap-2">
                        <ClipboardCheck className="h-4 w-4" />
                        Assignments ({assignments.length})
                    </TabsTrigger>
                    <TabsTrigger value="quizzes" className="flex items-center gap-2">
                        <Play className="h-4 w-4" />
                        Quizzes ({quizzes.length})
                    </TabsTrigger>
                    <TabsTrigger value="chat" className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Discussion
                    </TabsTrigger>
                </TabsList>

                {/* Materials Tab */}
                <TabsContent value="materials" className="space-y-4">
                    {materials.length === 0 ? (
                        <Card className="border-dashed border-2">
                            <CardContent className="py-12 text-center">
                                <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-slate-700">No Materials Yet</h3>
                                <p className="text-slate-500 mt-1">Your teacher hasn't uploaded any materials.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {materials.map((material) => (
                                <Card key={material.id} className="hover:shadow-md transition-shadow">
                                    <CardContent className="p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">{getFileIcon(material.fileUrl)}</span>
                                            <div>
                                                <h4 className="font-medium text-slate-900">{material.title}</h4>
                                                <p className="text-sm text-slate-500">
                                                    Added {formatDate(material.createdAt)}
                                                </p>
                                            </div>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => window.open(`http://localhost:5000${material.fileUrl}`, '_blank')}
                                        >
                                            <Download className="h-4 w-4 mr-2" />
                                            Download
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* Assignments Tab */}
                <TabsContent value="assignments" className="space-y-4">
                    {assignments.length === 0 ? (
                        <Card className="border-dashed border-2">
                            <CardContent className="py-12 text-center">
                                <ClipboardCheck className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-slate-700">No Assignments Yet</h3>
                                <p className="text-slate-500 mt-1">Your teacher hasn't posted any assignments.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {assignments.map((assignment) => {
                                const isPastDue = new Date(assignment.dueDate) < new Date();
                                return (
                                    <Card key={assignment.id} className={isPastDue ? 'border-red-200 bg-red-50/50' : ''}>
                                        <CardHeader className="pb-2">
                                            <div className="flex items-start justify-between">
                                                <CardTitle className="text-lg">{assignment.title}</CardTitle>
                                                <span className={`text-sm px-2 py-1 rounded ${isPastDue ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                                                    }`}>
                                                    Due: {formatDate(assignment.dueDate)}
                                                </span>
                                            </div>
                                            <CardDescription>{assignment.description}</CardDescription>
                                        </CardHeader>
                                        <CardContent className="pt-0 flex gap-3">
                                            {assignment.fileUrl && (
                                                <Button size="sm" variant="outline">
                                                    <LinkIcon className="h-4 w-4 mr-2" />
                                                    View Attachment
                                                </Button>
                                            )}
                                            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                                                <Upload className="h-4 w-4 mr-2" />
                                                Submit
                                            </Button>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </TabsContent>

                {/* Quizzes Tab */}
                <TabsContent value="quizzes" className="space-y-4">
                    {quizzes.length === 0 ? (
                        <Card className="border-dashed border-2">
                            <CardContent className="py-12 text-center">
                                <Play className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-slate-700">No Quizzes Yet</h3>
                                <p className="text-slate-500 mt-1">Your teacher hasn't created any quizzes.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {quizzes.map((quiz) => (
                                <Card key={quiz.id} className="hover:shadow-md transition-shadow">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <Play className="h-5 w-5 text-indigo-600" />
                                            {quiz.title}
                                        </CardTitle>
                                        {quiz.description && (
                                            <CardDescription>{quiz.description}</CardDescription>
                                        )}
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <div className="flex items-center justify-between">
                                            <div className="text-sm text-slate-500">
                                                {quiz._count?.questions || 0} questions
                                                {quiz.timeLimit && ` • ${quiz.timeLimit} min`}
                                            </div>
                                            <Button
                                                size="sm"
                                                className="bg-emerald-600 hover:bg-emerald-700"
                                                onClick={() => navigate(`/quiz/${quiz.id}`)}
                                            >
                                                <Play className="h-4 w-4 mr-2" />
                                                Start
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* Chat Tab */}
                <TabsContent value="chat" className="h-[500px]">
                    <ChatRoom classId={classId!} />
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default StudentClassDetail;
