// FILE: client/src/features/students/EditStudentModal.tsx
// 2026 Standard: Professional student edit modal with form validation

import {
    Calendar,
    Loader2,
    Mail,
    MapPin,
    Phone,
    Save,
    User,
    Users,
    X
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import api from '../../lib/axios';
import { cn } from '../../lib/utils';

// Validation Schema
const editStudentSchema = z.object({
    firstName: z.string().min(2, "First name is required"),
    lastName: z.string().min(2, "Last name is required"),
    dateOfBirth: z.string().optional(),
    gender: z.enum(["MALE", "FEMALE", "OTHER"]),
    address: z.string().optional(),
    guardianName: z.string().optional(),
    guardianPhone: z.string().optional(),
});

type EditStudentData = z.infer<typeof editStudentSchema>;

interface Student {
    id: string;
    firstName: string;
    lastName: string;
    dateOfBirth?: string | null;
    gender: string;
    address?: string | null;
    guardianName?: string | null;
    guardianPhone?: string | null;
    user: {
        email: string;
        isActive: boolean;
    };
}

interface EditStudentModalProps {
    student: Student;
    onClose: () => void;
    onSuccess: () => void;
}

export const EditStudentModal = ({ student, onClose, onSuccess }: EditStudentModalProps) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const [formData, setFormData] = useState<EditStudentData>({
        firstName: student.firstName,
        lastName: student.lastName,
        dateOfBirth: student.dateOfBirth ? new Date(student.dateOfBirth).toISOString().split('T')[0] : '',
        gender: (student.gender as "MALE" | "FEMALE" | "OTHER") || 'MALE',
        address: student.address || '',
        guardianName: student.guardianName || '',
        guardianPhone: student.guardianPhone || '',
    });

    // Close on escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    const handleChange = (field: keyof EditStudentData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error when field is edited
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            // Validate
            const validated = editStudentSchema.parse(formData);
            setErrors({});
            setIsSubmitting(true);

            await api.patch(`/students/${student.id}`, validated);

            toast.success("Student updated successfully!");
            onSuccess();
            onClose();
        } catch (err: any) {
            if (err instanceof z.ZodError) {
                const newErrors: Record<string, string> = {};
                err.errors.forEach((e) => {
                    if (e.path[0]) newErrors[e.path[0] as string] = e.message;
                });
                setErrors(newErrors);
            } else {
                toast.error(err.response?.data?.message || "Failed to update student");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative z-10 w-full max-w-lg mx-4 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
                <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">

                    {/* Header */}
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5 text-white">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg">
                                    <User className="h-5 w-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold">Edit Student</h2>
                                    <p className="text-indigo-100 text-sm">{student.user.email}</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-6 space-y-5">

                        {/* Name Fields */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                                    <User className="h-3.5 w-3.5 text-slate-400" />
                                    First Name
                                </label>
                                <Input
                                    value={formData.firstName}
                                    onChange={(e) => handleChange('firstName', e.target.value)}
                                    placeholder="John"
                                    className={cn(errors.firstName && "border-red-300 focus-visible:ring-red-400")}
                                />
                                {errors.firstName && <p className="text-xs text-red-500">{errors.firstName}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Last Name</label>
                                <Input
                                    value={formData.lastName}
                                    onChange={(e) => handleChange('lastName', e.target.value)}
                                    placeholder="Doe"
                                    className={cn(errors.lastName && "border-red-300 focus-visible:ring-red-400")}
                                />
                                {errors.lastName && <p className="text-xs text-red-500">{errors.lastName}</p>}
                            </div>
                        </div>

                        {/* DOB & Gender */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                    Date of Birth
                                </label>
                                <Input
                                    type="date"
                                    value={formData.dateOfBirth}
                                    onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Gender</label>
                                <select
                                    value={formData.gender}
                                    onChange={(e) => handleChange('gender', e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                >
                                    <option value="MALE">Male</option>
                                    <option value="FEMALE">Female</option>
                                    <option value="OTHER">Other</option>
                                </select>
                            </div>
                        </div>

                        {/* Address */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                                Address
                            </label>
                            <Input
                                value={formData.address}
                                onChange={(e) => handleChange('address', e.target.value)}
                                placeholder="Street, City, Province"
                            />
                        </div>

                        {/* Guardian Info */}
                        <div className="p-4 bg-slate-50 rounded-xl space-y-4">
                            <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                                <Users className="h-4 w-4 text-slate-400" />
                                Guardian Information
                            </h3>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-slate-500">Guardian Name</label>
                                    <Input
                                        value={formData.guardianName}
                                        onChange={(e) => handleChange('guardianName', e.target.value)}
                                        placeholder="Parent/Guardian name"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-slate-500 flex items-center gap-1">
                                        <Phone className="h-3 w-3" /> Phone
                                    </label>
                                    <Input
                                        value={formData.guardianPhone}
                                        onChange={(e) => handleChange('guardianPhone', e.target.value)}
                                        placeholder="09123456789"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-3 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onClose}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="bg-indigo-600 hover:bg-indigo-700 min-w-[120px]"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <>
                                        <Save className="h-4 w-4 mr-2" />
                                        Save Changes
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EditStudentModal;
