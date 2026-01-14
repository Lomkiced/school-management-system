// FILE: client/src/features/students/AddStudent.tsx
// 2026 Standard: Student registration wizard with parent account creation

import {
  BookOpen,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Contact,
  Eye,
  EyeOff,
  Info,
  Loader2,
  Lock,
  Mail,
  RefreshCw,
  User,
  Users
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import api from '../../lib/axios';
import { cn } from '../../lib/utils';

// --- Zod Schemas for Validation ---
const step1Schema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  dateOfBirth: z.string().refine((val) => new Date(val).toString() !== 'Invalid Date', "Invalid Date"),
  gender: z.enum(["MALE", "FEMALE", "OTHER"], { required_error: "Gender is required" }),
});

const step2Schema = z.object({
  address: z.string().optional(),
  guardianName: z.string().min(2, "Guardian name is required"),
  guardianPhone: z.string().regex(/^\+?[0-9\s-]{7,15}$/, "Invalid phone number"),
});

const step3Schema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

interface FormData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  guardianName: string;
  guardianPhone: string;
  email: string;
  password: string;
  createParent: boolean;
  parentEmail: string;
  parentPassword: string;
  parentFirstName: string;
  parentLastName: string;
}

// --- Step Indicator Component ---
const StepIndicator = ({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) => {
  const stepLabels = ['Personal', 'Guardian', 'Student Account', 'Parent Account'];

  return (
    <div className="flex items-center justify-center space-x-1 mb-8">
      {Array.from({ length: totalSteps }).map((_, idx) => {
        const stepNum = idx + 1;
        const isActive = stepNum === currentStep;
        const isCompleted = stepNum < currentStep;

        return (
          <div key={idx} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300",
                  isActive
                    ? "bg-indigo-600 text-white ring-4 ring-indigo-100"
                    : isCompleted
                      ? "bg-emerald-500 text-white"
                      : "bg-slate-100 text-slate-400"
                )}
              >
                {isCompleted ? <Check size={14} /> : stepNum}
              </div>
              <span className={cn(
                "text-[10px] mt-1 font-medium whitespace-nowrap",
                isActive ? "text-indigo-600" : isCompleted ? "text-emerald-600" : "text-slate-400"
              )}>
                {stepLabels[idx]}
              </span>
            </div>
            {stepNum < totalSteps && (
              <div
                className={cn(
                  "w-8 h-0.5 mx-1 rounded-full transition-all duration-300",
                  stepNum < currentStep ? "bg-emerald-500" : "bg-slate-200"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export const AddStudent = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showStudentPassword, setShowStudentPassword] = useState(false);
  const [showParentPassword, setShowParentPassword] = useState(false);

  // Form State
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    gender: 'MALE',
    dateOfBirth: '',
    address: '',
    guardianName: '',
    guardianPhone: '',
    email: '',
    password: '',
    createParent: true,
    parentEmail: '',
    parentPassword: '',
    parentFirstName: '',
    parentLastName: ''
  });

  // Auto-generate emails based on name
  useEffect(() => {
    if (currentStep === 3 && formData.firstName && formData.lastName) {
      const year = new Date().getFullYear();
      if (!formData.email) {
        const studentEmail = `${formData.firstName.toLowerCase()}.${formData.lastName.toLowerCase()}${year}@student.school.edu`.replace(/\s/g, '');
        setFormData(prev => ({ ...prev, email: studentEmail }));
      }
    }
  }, [currentStep, formData.firstName, formData.lastName]);

  useEffect(() => {
    if (currentStep === 4 && formData.guardianName && formData.createParent) {
      const names = formData.guardianName.split(' ');
      const firstName = names[0] || '';
      const lastName = names.slice(1).join(' ') || formData.lastName;

      if (!formData.parentEmail) {
        const parentEmail = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@parent.school.edu`.replace(/\s/g, '');
        setFormData(prev => ({
          ...prev,
          parentEmail,
          parentFirstName: firstName,
          parentLastName: lastName
        }));
      }
    }
  }, [currentStep, formData.guardianName, formData.createParent, formData.lastName]);

  const handleChange = (field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const generatePassword = (type: 'student' | 'parent') => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let password = '';
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    if (type === 'student') {
      setFormData(prev => ({ ...prev, password }));
      setShowStudentPassword(true);
    } else {
      setFormData(prev => ({ ...prev, parentPassword: password }));
      setShowParentPassword(true);
    }
  };

  const handleNext = () => {
    try {
      if (currentStep === 1) step1Schema.parse(formData);
      if (currentStep === 2) step2Schema.parse(formData);
      if (currentStep === 3) step3Schema.parse(formData);
      setCurrentStep((prev) => prev + 1);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
      }
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  const handleSubmit = async () => {
    try {
      // Validate parent info if creating parent
      if (formData.createParent) {
        if (!formData.parentEmail) {
          toast.error("Parent email is required");
          return;
        }
        if (!formData.parentPassword || formData.parentPassword.length < 6) {
          toast.error("Parent password must be at least 6 characters");
          return;
        }
      }

      setIsSubmitting(true);

      await api.post('/students', formData);

      toast.success("Student registered successfully!", {
        description: formData.createParent
          ? "Student and parent accounts have been created."
          : "Student account has been created."
      });
      navigate('/students');
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to register student");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/students')}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Register New Student</h1>
          <p className="text-slate-500 text-sm">Create student & parent accounts in one flow.</p>
        </div>
      </div>

      <StepIndicator currentStep={currentStep} totalSteps={4} />

      <Card className="border-slate-200 shadow-lg overflow-hidden">
        <div className="h-1.5 bg-slate-100 w-full">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500 ease-out"
            style={{ width: `${(currentStep / 4) * 100}%` }}
          />
        </div>

        <CardContent className="p-8 min-h-[420px]">
          {/* STEP 1: IDENTITY */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-2 mb-4 text-indigo-600">
                <User className="h-5 w-5" />
                <h2 className="font-semibold text-lg">Personal Identity</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">First Name <span className="text-red-500">*</span></label>
                  <Input
                    value={formData.firstName}
                    onChange={(e) => handleChange('firstName', e.target.value)}
                    placeholder="e.g. John"
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Last Name <span className="text-red-500">*</span></label>
                  <Input
                    value={formData.lastName}
                    onChange={(e) => handleChange('lastName', e.target.value)}
                    placeholder="e.g. Doe"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date of Birth <span className="text-red-500">*</span></label>
                  <Input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Gender <span className="text-red-500">*</span></label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={formData.gender}
                    onChange={(e) => handleChange('gender', e.target.value)}
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: GUARDIAN */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-2 mb-4 text-indigo-600">
                <Contact className="h-5 w-5" />
                <h2 className="font-semibold text-lg">Guardian Information</h2>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Address</label>
                <Input
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="Street, City, Province"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Guardian Full Name <span className="text-red-500">*</span></label>
                  <Input
                    value={formData.guardianName}
                    onChange={(e) => handleChange('guardianName', e.target.value)}
                    placeholder="e.g. Maria Doe"
                  />
                  <p className="text-xs text-slate-500">This will be used for parent account name</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Emergency Phone <span className="text-red-500">*</span></label>
                  <Input
                    value={formData.guardianPhone}
                    onChange={(e) => handleChange('guardianPhone', e.target.value)}
                    placeholder="09123456789"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: STUDENT ACCOUNT */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-2 mb-4 text-indigo-600">
                <BookOpen className="h-5 w-5" />
                <h2 className="font-semibold text-lg">Student Account</h2>
              </div>

              <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-lg text-sm text-indigo-800 flex items-start gap-3">
                <RefreshCw className="h-5 w-5 mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold">Auto-Generated Student Email</p>
                  <p className="opacity-90">Email based on student's name. You can edit it below.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Mail className="h-4 w-4 text-slate-400" />
                    Student Email <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Lock className="h-4 w-4 text-slate-400" />
                    Student Password <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        type={showStudentPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => handleChange('password', e.target.value)}
                        placeholder="Min 6 characters"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowStudentPassword(!showStudentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showStudentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <Button type="button" variant="outline" onClick={() => generatePassword('student')}>
                      Generate
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: PARENT ACCOUNT */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-2 mb-4 text-purple-600">
                <Users className="h-5 w-5" />
                <h2 className="font-semibold text-lg">Parent Account</h2>
              </div>

              {/* Toggle for creating parent */}
              <div className="p-4 bg-purple-50 border border-purple-100 rounded-lg">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.createParent}
                    onChange={(e) => handleChange('createParent', e.target.checked)}
                    className="w-5 h-5 rounded border-purple-300 text-purple-600 focus:ring-purple-500"
                  />
                  <div>
                    <p className="font-semibold text-purple-900">Create Parent Account</p>
                    <p className="text-sm text-purple-700">
                      Creates a login for {formData.guardianName || 'the guardian'} to view student progress
                    </p>
                  </div>
                </label>
              </div>

              {formData.createParent && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Parent First Name</label>
                      <Input
                        value={formData.parentFirstName}
                        onChange={(e) => handleChange('parentFirstName', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Parent Last Name</label>
                      <Input
                        value={formData.parentLastName}
                        onChange={(e) => handleChange('parentLastName', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Mail className="h-4 w-4 text-slate-400" />
                      Parent Email <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={formData.parentEmail}
                      onChange={(e) => handleChange('parentEmail', e.target.value)}
                    />
                    <p className="text-xs text-slate-500">
                      If this email exists, this student will be linked as a sibling
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Lock className="h-4 w-4 text-slate-400" />
                      Parent Password <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input
                          type={showParentPassword ? 'text' : 'password'}
                          value={formData.parentPassword}
                          onChange={(e) => handleChange('parentPassword', e.target.value)}
                          placeholder="Min 6 characters"
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowParentPassword(!showParentPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showParentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <Button type="button" variant="outline" onClick={() => generatePassword('parent')}>
                        Generate
                      </Button>
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex gap-3">
                      <Info className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-amber-800">Sibling Detection</p>
                        <p className="text-amber-700 mt-1">
                          If the parent email already exists, this student will automatically be linked to them as a sibling.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {!formData.createParent && (
                <div className="text-center py-8 text-slate-500">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>Parent account will not be created</p>
                  <p className="text-sm">You can link a parent later from the Parents page</p>
                </div>
              )}
            </div>
          )}
        </CardContent>

        {/* FOOTER ACTIONS */}
        <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1 || isSubmitting}
            className="bg-white"
          >
            Back
          </Button>

          <div className="flex gap-2">
            {currentStep < 4 ? (
              <Button onClick={handleNext} className="bg-indigo-600 hover:bg-indigo-700">
                Next <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-emerald-600 hover:bg-emerald-700 w-44"
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin h-4 w-4" />
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Complete Registration
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AddStudent;