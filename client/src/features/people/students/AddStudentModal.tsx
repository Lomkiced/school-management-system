// FILE: client/src/features/people/students/AddStudentModal.tsx
// 2026 Standard: Comprehensive Student Registration Wizard with Professional Print

import { useState, useEffect } from 'react';
import {
    ArrowLeft,
    ArrowRight,
    Check,
    CheckCircle2,
    Eye,
    EyeOff,
    Key,
    Loader2,
    Mail,
    Printer,
    Search,
    Shield,
    UserPlus,
    Users
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../../lib/axios';
import { Modal } from '../../../components/ui/Modal';

interface AddStudentModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentClass: any;
    onStudentAdded: () => void;
}

// Form data types
interface StudentFormData {
    // Personal Info
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: 'MALE' | 'FEMALE';
    address: string;
    gradeLevel: number;
    // Credentials
    email: string;
    password: string;
    confirmPassword: string;
}

interface ParentFormData {
    firstName: string;
    lastName: string;
    phone: string;
    address: string;
    relationship: string;
    // Credentials
    email: string;
    password: string;
    confirmPassword: string;
}

export const AddStudentModal = ({ isOpen, onClose, currentClass, onStudentAdded }: AddStudentModalProps) => {
    const [activeTab, setActiveTab] = useState<'search' | 'register'>('register');
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showStudentPassword, setShowStudentPassword] = useState(false);
    const [showParentPassword, setShowParentPassword] = useState(false);
    const [includeParent, setIncludeParent] = useState(true);
    const [printCredentials, setPrintCredentials] = useState(true);
    const [showReviewPassword, setShowReviewPassword] = useState(false); // New state for review step

    // --- SEARCH TAB STATE ---
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // --- REGISTRATION FORM STATE ---
    const [studentData, setStudentData] = useState<StudentFormData>({
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        gender: 'MALE',
        address: '',
        gradeLevel: 7,
        email: '',
        password: 'Student123',
        confirmPassword: 'Student123',
    });

    const [parentData, setParentData] = useState<ParentFormData>({
        firstName: '',
        lastName: '',
        phone: '',
        address: '',
        relationship: 'PARENT',
        email: '',
        password: 'Parent123',
        confirmPassword: 'Parent123',
    });

    // Reset on open
    useEffect(() => {
        if (isOpen) {
            setActiveTab('register');
            setCurrentStep(1);
            setSearchQuery('');
            setSearchResults([]);
            setSelectedStudentIds([]);
            setStudentData({
                firstName: '', lastName: '', dateOfBirth: '', gender: 'MALE',
                address: '', gradeLevel: 7, email: '', password: 'Student123', confirmPassword: 'Student123'
            });
            setParentData({
                firstName: '', lastName: '', phone: '', address: '', relationship: 'PARENT',
                email: '', password: 'Parent123', confirmPassword: 'Parent123'
            });
            setIncludeParent(true);
            setPrintCredentials(true);
            setShowReviewPassword(false);
        }
    }, [isOpen]);

    // Auto-generate student email from name
    useEffect(() => {
        if (studentData.firstName && studentData.lastName) {
            const generated = `${studentData.firstName.toLowerCase()}.${studentData.lastName.toLowerCase()}@student.school.edu`;
            if (!studentData.email || studentData.email.includes('@student.school.edu')) {
                setStudentData(prev => ({ ...prev, email: generated.replace(/\s+/g, '') }));
            }
        }
    }, [studentData.firstName, studentData.lastName]);

    // Auto-generate parent email
    useEffect(() => {
        if (parentData.firstName && parentData.lastName) {
            const generated = `${parentData.firstName.toLowerCase()}.${parentData.lastName.toLowerCase()}@parent.school.edu`;
            if (!parentData.email || parentData.email.includes('@parent.school.edu')) {
                setParentData(prev => ({ ...prev, email: generated.replace(/\s+/g, '') }));
            }
        }
    }, [parentData.firstName, parentData.lastName]);

    const steps = [
        { id: 1, title: 'Student Details', icon: Users },
        { id: 2, title: 'Student Login', icon: Key },
        { id: 3, title: 'Parent Account', icon: Users },
        { id: 4, title: 'Review & Finish', icon: CheckCircle2 },
    ];

    // --- VALIDATION ---
    const validateStep = (step: number): boolean => {
        switch (step) {
            case 1:
                if (!studentData.firstName || !studentData.lastName || !studentData.dateOfBirth) {
                    toast.error('Please fill in all required student fields');
                    return false;
                }
                return true;
            case 2:
                if (!studentData.email) {
                    toast.error('Student email is required');
                    return false;
                }
                if (studentData.password !== studentData.confirmPassword) {
                    toast.error('Student passwords do not match');
                    return false;
                }
                if (studentData.password.length < 6) {
                    toast.error('Password must be at least 6 characters');
                    return false;
                }
                return true;
            case 3:
                if (includeParent) {
                    if (!parentData.firstName || !parentData.lastName || !parentData.email) {
                        toast.error('Parent name and email are required');
                        return false;
                    }
                    if (parentData.password !== parentData.confirmPassword) {
                        toast.error('Parent passwords do not match');
                        return false;
                    }
                }
                return true;
            default:
                return true;
        }
    };

    const handleNext = () => {
        if (validateStep(currentStep)) {
            if (currentStep < 4) setCurrentStep(currentStep + 1);
        }
    };

    const handlePrevious = () => {
        if (currentStep > 1) setCurrentStep(currentStep - 1);
    };

    // --- SEARCH ACTIONS ---
    const handleSearch = async () => {
        setIsSearching(true);
        try {
            const res = await api.get('/students', { params: { search: searchQuery, limit: 50 } });
            setSearchResults(res.data.data);
            if (res.data.data.length === 0) toast.info('No students found');
        } catch (e) {
            toast.error('Search failed');
        } finally {
            setIsSearching(false);
        }
    };

    const handleEnrollSelected = async () => {
        if (!currentClass || selectedStudentIds.length === 0) return;
        setIsSubmitting(true);
        try {
            await api.post(`/classes/${currentClass.id}/enroll-bulk`, { studentIds: selectedStudentIds });
            toast.success(`Enrolled ${selectedStudentIds.length} student(s)`);
            onStudentAdded();
            onClose();
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Enrollment failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- REGISTRATION SUBMIT ---
    const handleSubmitRegistration = async () => {
        setIsSubmitting(true);

        // Capture data immediately for printing
        const printData = {
            student: { ...studentData },
            parent: { ...parentData },
            includeParent
        };

        try {
            // 1. Create Parent first (if included)
            let parentId: string | null = null;
            if (includeParent) {
                const parentRes = await api.post('/auth/register', {
                    email: parentData.email,
                    password: parentData.password,
                    role: 'PARENT', // Fixed in backend
                    firstName: parentData.firstName,
                    lastName: parentData.lastName,
                    phone: parentData.phone,
                    address: parentData.address,
                });
                parentId = parentRes.data.data?.parentProfile?.id || null;
            }

            // 2. Create Student with link to parent
            const studentPayload: any = {
                role: 'STUDENT', // Fixed in backend
                email: studentData.email,
                password: studentData.password,
                firstName: studentData.firstName,
                lastName: studentData.lastName,
                dateOfBirth: studentData.dateOfBirth,
                gender: studentData.gender,
                address: studentData.address,
                gradeLevel: studentData.gradeLevel,
            };

            if (parentId) {
                studentPayload.parentId = parentId;
            }

            // We use the same register endpoint or the specific student create endpoint?
            // The previous modal used POST /students. Let's stick to that if it works.
            // But wait, the previous code used POST /students.
            // Let's verify if POST /students handles user creation.
            // Assuming existing backend logic: /students usually creates profile AND user. 
            // Re-using the logic from Step 746 which used POST /students.
            const studentRes = await api.post('/students', studentPayload);
            const studentProfileId = studentRes.data.data.studentProfile.id;

            // 3. Enroll in class if applicable
            if (currentClass) {
                await api.post(`/classes/${currentClass.id}/enroll`, { studentId: studentProfileId });
            }

            toast.success('Registration successful!');

            // 4. Print credentials if requested (using captured data)
            if (printCredentials) {
                printCredentialSlips(printData);
            }

            onStudentAdded();
            onClose();
        } catch (e: any) {
            console.error('Registration error:', e);
            toast.error(e.response?.data?.message || 'Registration failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    const printCredentialSlips = (data: { student: StudentFormData, parent: ParentFormData, includeParent: boolean }) => {
        const printWindow = window.open('', '_blank', 'width=1000,height=800');
        if (!printWindow) return;

        const styles = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        
        body { 
            font-family: 'Inter', sans-serif; 
            background: #f3f4f6; 
            padding: 40px; 
            margin: 0;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }

        .page-container {
            max-width: 800px;
            margin: 0 auto;
            text-align: center;
        }

        .main-header {
            margin-bottom: 40px;
        }

        .main-header h1 {
            font-size: 28px;
            font-weight: 800;
            color: #111827;
            margin: 0 0 8px 0;
            text-transform: uppercase;
            letter-spacing: -0.5px;
        }

        .main-header p {
            font-size: 14px;
            color: #6b7280;
            margin: 0;
        }

        .card-container {
            background: white;
            border: 2px dashed #d1d5db;
            border-radius: 16px;
            padding: 32px;
            position: relative;
            margin-bottom: 40px;
            page-break-inside: avoid;
        }
        
        /* Scissors Icon */
        .cut-icon {
            position: absolute;
            top: -14px;
            left: 24px;
            background: #f3f4f6;
            padding: 0 8px;
            color: #9ca3af;
        }

        /* Inner Content */
        .card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 24px;
        }

        .brand-logo {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .logo-icon {
            width: 32px;
            height: 32px;
            background: #0f172a;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
        }

        .school-name {
            font-weight: 700;
            color: #1e293b;
            font-size: 16px;
            line-height: 1.1;
        }
        
        .role-badge {
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 6px 14px;
            border-radius: 6px;
            color: white;
        }

        .badge-student { background: #0f172a; }
        .badge-parent { background: #059669; }

        .user-name {
            font-size: 24px;
            font-weight: 700;
            color: #111827;
            margin-bottom: 24px;
            text-align: left;
        }

        .details-grid {
            display: flex;
            background: #f8fafc;
            border-radius: 12px;
            padding: 20px;
            gap: 24px;
            align-items: center;
        }

        .credentials {
            flex: 1;
            text-align: left;
        }

        .field-group {
            margin-bottom: 16px;
        }
        
        .field-group:last-child {
            margin-bottom: 0;
        }

        .field-label {
            display: block;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-weight: 600;
            color: #94a3b8;
            margin-bottom: 4px;
        }

        .field-value {
            font-family: 'JetBrains Mono', monospace;
            font-size: 16px;
            color: #334155;
            font-weight: 600;
        }

        .qr-section {
            text-align: center;
            padding-left: 24px;
            border-left: 2px solid #e2e8f0;
        }

        .qr-code {
            width: 96px;
            height: 96px;
            margin-bottom: 8px;
            border-radius: 8px;
        }

        .scan-text {
            font-size: 10px;
            color: #64748b;
            font-weight: 500;
        }

        .security-alert {
            margin-top: 20px;
            color: #ef4444;
            font-size: 12px;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 6px;
        }

        @media print {
            body { background: white; padding: 0; }
            .cut-icon { background: white; }
            .page-container { margin: 0; width: 100%; max-width: none; }
            .card-container { border-color: #94a3b8; box-shadow: none; break-inside: avoid; }
        }
      </style>
    `;

        // SVG Scissors Icon
        const scissorsSvg = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="6" cy="6" r="3"></circle>
            <circle cx="6" cy="18" r="3"></circle>
            <line x1="20" y1="4" x2="8.12" y2="15.88"></line>
            <line x1="14.47" y1="14.48" x2="20" y2="20"></line>
            <line x1="8.12" y1="8.12" x2="12" y2="12"></line>
        </svg>
    `;

        const renderCard = (role: 'Student' | 'Parent', name: string, email: string, pass: string, extra: string) => {
            const qrData = JSON.stringify({ e: email, p: pass });
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrData)}`;

            return `
        <div class="card-container">
            <div class="cut-icon">${scissorsSvg}</div>
            
            <div class="card-header">
                <div class="brand-logo">
                    <div class="logo-icon">S</div>
                    <div class="school-name">School Management<br><span style="font-weight:400; color:#64748b; font-size:12px">Access Portal</span></div>
                </div>
                <span class="role-badge badge-${role.toLowerCase()}">${role} Access</span>
            </div>

            <div class="user-name">${name}</div>

            <div class="details-grid">
                <div class="credentials">
                    <div class="field-group">
                        <span class="field-label">USERNAME / EMAIL</span>
                        <div class="field-value">${email}</div>
                    </div>
                    <div class="field-group">
                        <span class="field-label">INITIAL PASSWORD</span>
                        <div class="field-value">${pass}</div>
                    </div>
                    <div class="field-group">
                        <span class="field-label">DETAILS</span>
                        <div class="field-value" style="font-family: 'Inter', sans-serif; font-size: 13px;">${extra}</div>
                    </div>
                </div>

                <div class="qr-section">
                    <img src="${qrUrl}" class="qr-code" alt="Login QR" />
                    <div class="scan-text">Scan to Login</div>
                </div>
            </div>

            <div class="security-alert">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                Security Alert: Change your password immediately after first login.
            </div>
        </div>
        `;
        };

        const dateStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

        const studentCard = renderCard(
            'Student',
            `${data.student.lastName}, ${data.student.firstName}`,
            data.student.email,
            data.student.password,
            `Grade ${data.student.gradeLevel || 'N/A'}`
        );

        let parentCard = '';
        if (data.includeParent) {
            parentCard = renderCard(
                'Parent',
                `${data.parent.lastName}, ${data.parent.firstName}`,
                data.parent.email,
                data.parent.password,
                `Linked to: ${data.student.firstName}`
            );
        }

        printWindow.document.write(`
      <html>
        <head>
          <title>Access Credentials - ${data.student.lastName}</title>
          ${styles}
        </head>
        <body>
          <div class="page-container">
            <div class="main-header">
                <h1>Confidential Login Access</h1>
                <p>Generated on ${dateStr} • Do not share this slip</p>
            </div>
            
            ${studentCard}
            ${parentCard}
            
            <script>
                // Auto print after images load
                window.onload = function() { 
                    setTimeout(() => {
                        window.print();
                        window.close();
                    }, 500);
                }
            </script>
          </div>
        </body>
      </html>
    `);
        printWindow.document.close();
    };

    // --- RENDER STEP HELPERS ---
    const renderStepIndicator = () => (
        <div className="flex items-center justify-center mb-8">
            {steps.map((step, idx) => {
                const isActive = currentStep === step.id;
                const isCompleted = currentStep > step.id;

                return (
                    <div key={step.id} className="flex items-center">
                        <div className={`flex flex-col items-center gap-2 relative z-10 ${idx !== 0 ? 'ml-[-1px]' : ''}`}>
                            <div
                                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 ${isActive
                                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg scale-110'
                                    : isCompleted
                                        ? 'bg-emerald-500 border-emerald-500 text-white'
                                        : 'bg-white border-slate-200 text-slate-300'
                                    }`}
                            >
                                {isCompleted ? <Check size={20} /> : <step.icon size={18} />}
                            </div>
                            <span className={`text-[10px] font-bold uppercase tracking-wider absolute -bottom-6 w-24 text-center ${isActive ? 'text-indigo-600' : isCompleted ? 'text-emerald-600' : 'text-slate-300'}`}>
                                {step.title}
                            </span>
                        </div>
                        {idx < steps.length - 1 && (
                            <div className={`w-16 h-1 mx-2 rounded transition-colors duration-300 ${isCompleted ? 'bg-emerald-500' : 'bg-slate-100'}`} />
                        )}
                    </div>
                );
            })}
        </div>
    );

    const renderStudentDetailsStep = () => (
        <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
            <div className="grid grid-cols-2 gap-5">
                <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700">First Name <span className="text-rose-500">*</span></label>
                    <input
                        type="text"
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                        placeholder="John"
                        value={studentData.firstName}
                        onChange={e => setStudentData({ ...studentData, firstName: e.target.value })}
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700">Last Name <span className="text-rose-500">*</span></label>
                    <input
                        type="text"
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                        placeholder="Doe"
                        value={studentData.lastName}
                        onChange={e => setStudentData({ ...studentData, lastName: e.target.value })}
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
                <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700">Date of Birth <span className="text-rose-500">*</span></label>
                    <input
                        type="date"
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                        value={studentData.dateOfBirth}
                        onChange={e => setStudentData({ ...studentData, dateOfBirth: e.target.value })}
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700">Gender <span className="text-rose-500">*</span></label>
                    <select
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                        value={studentData.gender}
                        onChange={e => setStudentData({ ...studentData, gender: e.target.value as 'MALE' | 'FEMALE' })}
                    >
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
                <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700">Grade Level</label>
                    <select
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                        value={studentData.gradeLevel}
                        onChange={e => setStudentData({ ...studentData, gradeLevel: parseInt(e.target.value) })}
                    >
                        {[...Array(12)].map((_, i) => (
                            <option key={i + 1} value={i + 1}>Grade {i + 1}</option>
                        ))}
                    </select>
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700">Address</label>
                    <input
                        type="text"
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                        placeholder="City, Street"
                        value={studentData.address}
                        onChange={e => setStudentData({ ...studentData, address: e.target.value })}
                    />
                </div>
            </div>
        </div>
    );

    const renderStudentCredentialsStep = () => (
        <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
            <div className="p-4 bg-purple-50 rounded-xl border border-purple-100 flex gap-4">
                <div className="p-2 bg-white rounded-lg shadow-sm text-purple-600 h-fit">
                    <Key size={24} />
                </div>
                <div>
                    <h4 className="font-bold text-purple-900">Student Portal Login</h4>
                    <p className="text-sm text-purple-700">These credentials will be used by the student to access their dashboard.</p>
                </div>
            </div>

            <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Mail size={14} /> Email (Username) <span className="text-rose-500">*</span>
                </label>
                <input
                    type="email"
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-800 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="student@school.edu"
                    value={studentData.email}
                    onChange={e => setStudentData({ ...studentData, email: e.target.value })}
                />
                <p className="text-xs text-slate-500">Auto-generated based on name. You can edit this if needed.</p>
            </div>

            <div className="grid grid-cols-2 gap-5">
                <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <Shield size={14} /> Password <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                        <input
                            type={showStudentPassword ? 'text' : 'password'}
                            className="w-full p-3 pr-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-mono"
                            value={studentData.password}
                            onChange={e => setStudentData({ ...studentData, password: e.target.value })}
                        />
                        <button
                            type="button"
                            onClick={() => setShowStudentPassword(!showStudentPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                            {showStudentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700">Confirm Password <span className="text-rose-500">*</span></label>
                    <input
                        type={showStudentPassword ? 'text' : 'password'}
                        className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-mono"
                        value={studentData.confirmPassword}
                        onChange={e => setStudentData({ ...studentData, confirmPassword: e.target.value })}
                    />
                </div>
            </div>
        </div>
    );

    const renderParentStep = () => (
        <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">

            <div
                onClick={() => setIncludeParent(!includeParent)}
                className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${includeParent ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-slate-50 hover:border-emerald-300'}`}
            >
                <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${includeParent ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-300'}`}>
                    {includeParent && <Check size={16} />}
                </div>
                <div>
                    <h3 className="font-bold text-slate-900">Create Parent Portal Account</h3>
                    <p className="text-sm text-slate-500">Enable parent access to view grades, attendance, and billing.</p>
                </div>
            </div>

            {includeParent && (
                <div className="space-y-5 pl-2 border-l-2 border-slate-200 ml-5 py-2">
                    <div className="grid grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-slate-700">Parent First Name <span className="text-rose-500">*</span></label>
                            <input
                                type="text"
                                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                value={parentData.firstName}
                                onChange={e => setParentData({ ...parentData, firstName: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-slate-700">Parent Last Name <span className="text-rose-500">*</span></label>
                            <input
                                type="text"
                                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                value={parentData.lastName}
                                onChange={e => setParentData({ ...parentData, lastName: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-slate-700">Phone Number</label>
                            <input
                                type="tel"
                                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                value={parentData.phone}
                                onChange={e => setParentData({ ...parentData, phone: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-slate-700">Relationship</label>
                            <select
                                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                                value={parentData.relationship}
                                onChange={e => setParentData({ ...parentData, relationship: e.target.value })}
                            >
                                <option value="PARENT">Parent</option>
                                <option value="GUARDIAN">Guardian</option>
                                <option value="MOTHER">Mother</option>
                                <option value="FATHER">Father</option>
                            </select>
                        </div>
                    </div>

                    <div className="bg-emerald-50/50 p-4 rounded-lg border border-emerald-100 space-y-4">
                        <h4 className="text-sm font-bold text-emerald-800 flex items-center gap-2">
                            <Key size={16} /> Parent Login Credentials
                        </h4>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-emerald-700">Email (Username)</label>
                            <input
                                type="email"
                                className="w-full p-2 border border-emerald-200 rounded bg-white text-sm font-mono"
                                value={parentData.email}
                                onChange={e => setParentData({ ...parentData, email: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-emerald-700">Password</label>
                                <div className="relative">
                                    <input
                                        type={showParentPassword ? 'text' : 'password'}
                                        className="w-full p-2 border border-emerald-200 rounded bg-white text-sm font-mono"
                                        value={parentData.password}
                                        onChange={e => setParentData({ ...parentData, password: e.target.value })}
                                    />
                                    <button type="button" onClick={() => setShowParentPassword(!showParentPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 text-emerald-400">
                                        {showParentPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-emerald-700">Confirm</label>
                                <input
                                    type={showParentPassword ? 'text' : 'password'}
                                    className="w-full p-2 border border-emerald-200 rounded bg-white text-sm font-mono"
                                    value={parentData.confirmPassword}
                                    onChange={e => setParentData({ ...parentData, confirmPassword: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    const renderReviewStep = () => {
        return (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                    <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex justify-between items-center">
                        <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wide">Student Profile</h3>
                        <button onClick={() => setCurrentStep(1)} className="text-xs text-indigo-600 hover:underline">Edit</button>
                    </div>
                    <div className="p-4 grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                        <div>
                            <span className="block text-slate-500 text-xs">Full Name</span>
                            <span className="font-medium text-slate-900">{studentData.firstName} {studentData.lastName}</span>
                        </div>
                        <div>
                            <span className="block text-slate-500 text-xs">Date of Birth</span>
                            <span className="font-medium text-slate-900">{studentData.dateOfBirth}</span>
                        </div>
                        <div>
                            <span className="block text-slate-500 text-xs">Email (Username)</span>
                            <span className="font-mono text-indigo-600">{studentData.email}</span>
                        </div>
                        <div>
                            <span className="block text-slate-500 text-xs">Password</span>
                            <div className="flex items-center gap-2">
                                <span className="font-mono text-slate-900">{showReviewPassword ? studentData.password : '••••••••'}</span>
                                <button onClick={() => setShowReviewPassword(!showReviewPassword)} className="text-slate-400 hover:text-indigo-600">
                                    {showReviewPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {includeParent && (
                    <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl overflow-hidden">
                        <div className="bg-emerald-100/50 px-4 py-2 border-b border-emerald-200 flex justify-between items-center">
                            <h3 className="font-bold text-emerald-800 text-sm uppercase tracking-wide">Parent Account</h3>
                            <button onClick={() => setCurrentStep(3)} className="text-xs text-emerald-600 hover:underline">Edit</button>
                        </div>
                        <div className="p-4 grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                            <div>
                                <span className="block text-emerald-600/70 text-xs">Parent Name</span>
                                <span className="font-medium text-emerald-900">{parentData.firstName} {parentData.lastName}</span>
                            </div>
                            <div>
                                <span className="block text-emerald-600/70 text-xs">Relationship</span>
                                <span className="font-medium text-emerald-900">{parentData.relationship}</span>
                            </div>
                            <div>
                                <span className="block text-emerald-600/70 text-xs">Email</span>
                                <span className="font-mono text-emerald-700">{parentData.email}</span>
                            </div>
                            <div>
                                <span className="block text-emerald-600/70 text-xs">Password</span>
                                <div className="flex items-center gap-2">
                                    <span className="font-mono text-emerald-900">{showReviewPassword ? parentData.password : '••••••••'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <label className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl border border-amber-200 cursor-pointer hover:bg-amber-100 transition-colors">
                    <div className="pt-1">
                        <input
                            type="checkbox"
                            className="w-5 h-5 text-amber-600 rounded border-amber-300 focus:ring-amber-500"
                            checked={printCredentials}
                            onChange={e => setPrintCredentials(e.target.checked)}
                        />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 font-bold text-amber-900">
                            <Printer size={18} /> Print Credential Slips
                        </div>
                        <p className="text-xs text-amber-700 mt-1">
                            Highly recommended. Generates a professional PDF with login details for the student and parent to keep.
                        </p>
                    </div>
                </label>
            </div>
        );
    };

    // --- MAIN RENDER ---
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Register New Student ${currentClass ? `to ${currentClass.name}` : ''}`}
            maxWidth="max-w-2xl"
        >
            <div className="flex flex-col h-[650px]">
                {/* TABS */}
                <div className="flex border-b mb-6 bg-slate-50/50 rounded-t-lg">
                    <button
                        onClick={() => { setActiveTab('register'); setCurrentStep(1); }}
                        className={`flex-1 py-4 font-bold flex justify-center items-center gap-2 transition-all border-b-2 ${activeTab === 'register' ? 'text-indigo-600 border-indigo-600 bg-white' : 'text-slate-400 border-transparent hover:text-slate-600'}`}
                    >
                        <UserPlus size={18} /> Resgistration Wizard
                    </button>
                    <button
                        onClick={() => setActiveTab('search')}
                        className={`flex-1 py-4 font-bold flex justify-center items-center gap-2 transition-all border-b-2 ${activeTab === 'search' ? 'text-indigo-600 border-indigo-600 bg-white' : 'text-slate-400 border-transparent hover:text-slate-600'}`}
                    >
                        <Search size={18} /> Enroll Existing
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-6 pb-6 custom-scrollbar">
                    {/* SEARCH TAB */}
                    {activeTab === 'search' && (
                        <div className="space-y-6">
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-3.5 text-slate-400" size={18} />
                                    <input
                                        className="w-full pl-10 p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-shadow"
                                        placeholder="Search by name or email..."
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleSearch()}
                                    />
                                </div>
                                <button
                                    onClick={handleSearch}
                                    disabled={isSearching}
                                    className="px-6 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
                                >
                                    {isSearching ? <Loader2 size={20} className="animate-spin" /> : 'Search'}
                                </button>
                            </div>

                            <div className="min-h-[300px] border rounded-xl bg-slate-50 overflow-hidden">
                                {searchResults.length > 0 ? (
                                    <div className="divide-y divide-slate-100">
                                        {searchResults.map(s => (
                                            <div
                                                key={s.id}
                                                className={`p-4 flex justify-between items-center cursor-pointer transition-colors ${selectedStudentIds.includes(s.id) ? 'bg-indigo-50' : 'hover:bg-white'}`}
                                                onClick={() => {
                                                    if (selectedStudentIds.includes(s.id)) {
                                                        setSelectedStudentIds(ids => ids.filter(i => i !== s.id));
                                                    } else {
                                                        setSelectedStudentIds(ids => [...ids, s.id]);
                                                    }
                                                }}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${selectedStudentIds.includes(s.id) ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-300'}`}>
                                                        {selectedStudentIds.includes(s.id) && <Check size={14} />}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-800">{s.firstName} {s.lastName}</div>
                                                        <div className="text-xs text-slate-500">{s.user?.email || 'No email'}</div>
                                                    </div>
                                                </div>
                                                {currentClass && <span className="text-xs font-mono bg-slate-200 px-2 py-1 rounded text-slate-600">{s.studentProfile?.gradeLevel ? `Grade ${s.studentProfile.gradeLevel}` : 'Student'}</span>}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8">
                                        <Search size={48} className="opacity-20 mb-4" />
                                        <p className="font-medium">Search for students to enroll</p>
                                        <p className="text-xs opacity-70 mt-1">Enter a name above to find existing students</p>
                                    </div>
                                )}
                            </div>

                            {selectedStudentIds.length > 0 && (
                                <div className="flex justify-between items-center bg-indigo-900 text-white p-4 rounded-xl shadow-lg animate-in slide-in-from-bottom-4">
                                    <span className="font-bold pl-2">{selectedStudentIds.length} students selected</span>
                                    <button
                                        onClick={handleEnrollSelected}
                                        disabled={isSubmitting}
                                        className="px-6 py-2 bg-white text-indigo-900 rounded-lg font-bold hover:bg-indigo-50 disabled:opacity-50 flex items-center gap-2 transition-colors"
                                    >
                                        {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />}
                                        Enroll Now
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* REGISTRATION TAB */}
                    {activeTab === 'register' && (
                        <div className="flex flex-col h-full">
                            {renderStepIndicator()}

                            <div className="flex-1">
                                <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                                    {steps[currentStep - 1].icon && (() => {
                                        const StepIcon = steps[currentStep - 1].icon;
                                        return (
                                            <div className="p-1.5 bg-indigo-100 rounded text-indigo-600">
                                                <StepIcon size={20} />
                                            </div>
                                        );
                                    })()}
                                    {steps[currentStep - 1].title}
                                </h3>
                                {currentStep === 1 && renderStudentDetailsStep()}
                                {currentStep === 2 && renderStudentCredentialsStep()}
                                {currentStep === 3 && renderParentStep()}
                                {currentStep === 4 && renderReviewStep()}
                            </div>
                        </div>
                    )}
                </div>

                {/* FOOTER NAVIGATION */}
                {activeTab === 'register' && (
                    <div className="p-6 border-t mt-auto flex justify-between items-center bg-white rounded-b-xl z-10">
                        <button
                            onClick={handlePrevious}
                            disabled={currentStep === 1}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all ${currentStep === 1 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-100'}`}
                        >
                            <ArrowLeft size={18} /> Back
                        </button>

                        {currentStep < 4 ? (
                            <button
                                onClick={handleNext}
                                className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg hover:shadow-indigo-200 transition-all"
                            >
                                Next Step <ArrowRight size={18} />
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmitRegistration}
                                disabled={isSubmitting}
                                className="flex items-center gap-2 px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-lg hover:shadow-emerald-200 transition-all disabled:opacity-70 disabled:cursor-wait"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 size={20} className="animate-spin" /> Creating Account...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 size={20} /> Complete Registration
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </Modal>
    );
};
