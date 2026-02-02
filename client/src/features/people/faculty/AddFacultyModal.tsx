import { useState, useEffect } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { User, Mail, Phone, MapPin, Building2, BookOpen, Lock, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../../lib/axios';

interface AddFacultyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onFacultyAdded: () => void;
}

export const AddFacultyModal = ({ isOpen, onClose, onFacultyAdded }: AddFacultyModalProps) => {
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [departments, setDepartments] = useState<any[]>([]);

    // Form State
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        departmentId: '',
        specialization: '',
        password: '',
        confirmPassword: ''
    });

    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setStep(1);
            setFormData({
                firstName: '',
                lastName: '',
                email: '',
                phone: '',
                address: '',
                departmentId: '',
                specialization: '',
                password: '',
                confirmPassword: ''
            });
            fetchDepartments();
        }
    }, [isOpen]);

    const fetchDepartments = async () => {
        try {
            const res = await api.get('/departments');
            setDepartments(res.data.data || []);
        } catch (e) {
            console.error('Failed to load departments');
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const validateStep1 = () => {
        if (!formData.firstName || !formData.lastName || !formData.email) {
            toast.error('Please fill in all required fields');
            return false;
        }
        return true;
    };

    const validateStep2 = () => {
        // Specialization is optional, but department might be good to enforce if available
        return true;
    };

    const validateStep3 = () => {
        if (formData.password && formData.password.length < 6) {
            toast.error('Password must be at least 6 characters');
            return false;
        }
        if (formData.password !== formData.confirmPassword) {
            toast.error('Passwords do not match');
            return false;
        }
        return true;
    };

    const handleNext = () => {
        if (step === 1 && validateStep1()) setStep(2);
        else if (step === 2 && validateStep2()) setStep(3);
    };

    const handleSubmit = async () => {
        if (!validateStep3()) return;

        setIsLoading(true);
        try {
            await api.post('/teachers', {
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                phone: formData.phone,
                address: formData.address,
                departmentId: formData.departmentId,
                specialization: formData.specialization,
                password: formData.password || undefined // Only send if provided
            });

            toast.success('Faculty member added successfully');
            onFacultyAdded();
            onClose();
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Failed to add faculty');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add New Faculty Member">
            <div className="w-full max-w-2xl mx-auto">
                {/* Stepper */}
                <div className="flex items-center justify-center mb-8">
                    {[
                        { num: 1, label: 'Personal Info' },
                        { num: 2, label: 'Academic' },
                        { num: 3, label: 'Credentials' }
                    ].map((s, idx) => (
                        <div key={s.num} className="flex items-center">
                            <div className={`
                                flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm transition-colors
                                ${step >= s.num ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}
                            `}>
                                {step > s.num ? <CheckCircle2 size={16} /> : s.num}
                            </div>
                            <span className={`ml-2 text-sm font-medium ${step >= s.num ? 'text-indigo-600' : 'text-slate-400'}`}>
                                {s.label}
                            </span>
                            {idx < 2 && (
                                <div className={`w-12 h-0.5 mx-2 ${step > s.num ? 'bg-indigo-600' : 'bg-slate-100'}`} />
                            )}
                        </div>
                    ))}
                </div>

                <div className="min-h-[300px]">
                    {step === 1 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">First Name *</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                        <input
                                            name="firstName"
                                            value={formData.firstName}
                                            onChange={handleChange}
                                            className="w-full pl-9 p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                            placeholder="e.g. Juan"
                                            autoFocus
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Last Name *</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                        <input
                                            name="lastName"
                                            value={formData.lastName}
                                            onChange={handleChange}
                                            className="w-full pl-9 p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                            placeholder="e.g. Dela Cruz"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address *</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                    <input
                                        name="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="w-full pl-9 p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                        placeholder="juan.delacruz@school.edu"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                        <input
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            className="w-full pl-9 p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                            placeholder="0912 345 6789"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                        <input
                                            name="address"
                                            value={formData.address}
                                            onChange={handleChange}
                                            className="w-full pl-9 p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                            placeholder="City, Province"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Department Assigment</label>
                                <div className="relative">
                                    <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                    <select
                                        name="departmentId"
                                        value={formData.departmentId}
                                        onChange={handleChange}
                                        className="w-full pl-9 p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none appearance-none bg-white"
                                    >
                                        <option value="">-- No Department --</option>
                                        {departments.map(d => (
                                            <option key={d.id} value={d.id}>{d.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <p className="text-xs text-slate-500 mt-1">Assigning a department helps in organizing faculty workload.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Specialization / Title</label>
                                <div className="relative">
                                    <BookOpen className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                    <input
                                        name="specialization"
                                        value={formData.specialization}
                                        onChange={handleChange}
                                        className="w-full pl-9 p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                        placeholder="e.g. Mathematics, Science Coordinator"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
                                <AlertCircle className="text-amber-600 shrink-0" size={20} />
                                <div>
                                    <h4 className="font-bold text-amber-800 text-sm">Default Password Config</h4>
                                    <p className="text-xs text-amber-700 mt-1">
                                        If left blank, the password will default to <strong>Teacher123</strong>.
                                        We recommend setting a secure temporary password.
                                    </p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                    <input
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="w-full pl-9 pr-10 p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                        placeholder="Leave blank for default"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                    <input
                                        name="confirmPassword"
                                        type={showPassword ? "text" : "password"}
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        className="w-full pl-9 p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                        placeholder="Repeat password"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-between items-center pt-6 border-t border-slate-100 mt-4">
                    {step > 1 ? (
                        <button
                            onClick={() => setStep(step - 1)}
                            className="text-slate-500 font-medium hover:text-slate-800"
                        >
                            Back
                        </button>
                    ) : (
                        <div />
                    )}

                    <div className="flex gap-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg font-medium"
                        >
                            Cancel
                        </button>
                        {step < 3 ? (
                            <button
                                onClick={handleNext}
                                className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors"
                            >
                                Continue
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                disabled={isLoading}
                                className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                            >
                                {isLoading ? 'Creating...' : 'Create Faculty Account'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </Modal>
    );
};
