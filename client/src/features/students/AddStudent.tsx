// FILE: client/src/features/students/AddStudent.tsx
import {
  BookOpen,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Contact,
  Loader2,
  Mail,
  RefreshCw,
  User
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
  guardianName: z.string().min(2, "Guardian name is required for minors"),
  guardianPhone: z.string().regex(/^\+?[0-9\s-]{7,15}$/, "Invalid phone number"),
});

const step3Schema = z.object({
  email: z.string().email("Invalid email address"),
  // Password is auto-generated usually, but we allow manual override
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type FormData = z.infer<typeof step1Schema> & z.infer<typeof step2Schema> & z.infer<typeof step3Schema>;

// --- Components ---

const StepIndicator = ({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) => {
  return (
    <div className="flex items-center justify-center space-x-2 mb-8">
      {Array.from({ length: totalSteps }).map((_, idx) => {
        const stepNum = idx + 1;
        const isActive = stepNum === currentStep;
        const isCompleted = stepNum < currentStep;

        return (
          <div key={idx} className="flex items-center">
            <div
              className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300",
                isActive
                  ? "bg-indigo-600 text-white ring-4 ring-indigo-100"
                  : isCompleted
                  ? "bg-emerald-500 text-white"
                  : "bg-slate-100 text-slate-400"
              )}
            >
              {isCompleted ? <Check size={14} /> : stepNum}
            </div>
            {stepNum < totalSteps && (
              <div
                className={cn(
                  "w-12 h-1 mx-2 rounded-full transition-all duration-300",
                  stepNum < currentStep ? "bg-emerald-500" : "bg-slate-100"
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
  
  // Form State
  const [formData, setFormData] = useState<Partial<FormData>>({
    gender: 'MALE',
    dateOfBirth: '',
    address: '',
    guardianName: '',
    guardianPhone: '',
    email: '',
    password: ''
  });

  // Smart Feature: Auto-generate email based on name
  useEffect(() => {
    if (currentStep === 3 && formData.firstName && formData.lastName && !formData.email) {
      const year = new Date().getFullYear();
      const generatedEmail = `${formData.firstName.toLowerCase()}.${formData.lastName.toLowerCase()}${year}@school.edu`.replace(/\s/g, '');
      setFormData(prev => ({ ...prev, email: generatedEmail, password: 'Student123!' }));
    }
  }, [currentStep, formData.firstName, formData.lastName]);

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Navigation Logic
  const handleNext = () => {
    try {
      if (currentStep === 1) step1Schema.parse(formData);
      if (currentStep === 2) step2Schema.parse(formData);
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
      setIsSubmitting(true);
      // Final Validation
      const finalData = { ...formData } as FormData; // Cast after validation
      
      // API Call
      await api.post('/students', finalData);
      
      toast.success("Student registered successfully!");
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
          <p className="text-slate-500 text-sm">Complete the wizard to enroll a student.</p>
        </div>
      </div>

      <StepIndicator currentStep={currentStep} totalSteps={3} />

      <Card className="border-slate-200 shadow-lg overflow-hidden">
        <div className="h-1 bg-slate-100 w-full">
          <div 
            className="h-full bg-indigo-600 transition-all duration-500 ease-out" 
            style={{ width: `${(currentStep / 3) * 100}%` }}
          />
        </div>

        <CardContent className="p-8 min-h-[400px]">
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
                    value={formData.firstName || ''} 
                    onChange={(e) => handleChange('firstName', e.target.value)} 
                    placeholder="e.g. John" 
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Last Name <span className="text-red-500">*</span></label>
                  <Input 
                    value={formData.lastName || ''} 
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
                    value={formData.dateOfBirth || ''} 
                    onChange={(e) => handleChange('dateOfBirth', e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Gender <span className="text-red-500">*</span></label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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

          {/* STEP 2: CONTACT */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-2 mb-4 text-indigo-600">
                <Contact className="h-5 w-5" />
                <h2 className="font-semibold text-lg">Guardian & Contact</h2>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Address</label>
                <Input 
                  value={formData.address || ''} 
                  onChange={(e) => handleChange('address', e.target.value)} 
                  placeholder="Street address, City, Province" 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Guardian Name <span className="text-red-500">*</span></label>
                  <Input 
                    value={formData.guardianName || ''} 
                    onChange={(e) => handleChange('guardianName', e.target.value)} 
                    placeholder="Full name of parent/guardian" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Emergency Phone <span className="text-red-500">*</span></label>
                  <Input 
                    value={formData.guardianPhone || ''} 
                    onChange={(e) => handleChange('guardianPhone', e.target.value)} 
                    placeholder="0912 345 6789" 
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: ACADEMIC (ACCOUNT) */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-2 mb-4 text-indigo-600">
                <BookOpen className="h-5 w-5" />
                <h2 className="font-semibold text-lg">Account Setup</h2>
              </div>

              <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-lg text-sm text-indigo-800 mb-4 flex items-start gap-3">
                <RefreshCw className="h-5 w-5 mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold">Auto-Generated Credentials</p>
                  <p className="opacity-90">We've created a temporary login for this student based on their name. You can edit this below.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">School Email <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input 
                      className="pl-9"
                      value={formData.email || ''} 
                      onChange={(e) => handleChange('email', e.target.value)} 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Default Password <span className="text-red-500">*</span></label>
                  <Input 
                    type="password"
                    value={formData.password || ''} 
                    onChange={(e) => handleChange('password', e.target.value)} 
                  />
                </div>
              </div>
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
            {currentStep < 3 ? (
              <Button onClick={handleNext} className="bg-indigo-600 hover:bg-indigo-700">
                Next Step <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit} 
                disabled={isSubmitting}
                className="bg-emerald-600 hover:bg-emerald-700 w-32"
              >
                {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : <><CheckCircle2 className="mr-2 h-4 w-4" /> Finish</>}
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};