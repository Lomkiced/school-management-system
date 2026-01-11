// FILE: client/src/features/auth/LoginForm.tsx
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/authStore';

// Strict Validation Schema
const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      // 1. Send Login Request
      const response = await api.post('/auth/login', {
        email: data.email.trim(),
        password: data.password.trim()
      });

      // 2. Defensive Data Extraction
      // We safely check nested properties to avoid "undefined" access errors
      const responseData = response.data || {};
      const payload = responseData.data || responseData; // Handle variations in API structure

      // Check for Token & User existence
      const token = payload.token || payload.accessToken;
      const user = payload.user || payload.userData;

      if (!token || !user) {
        throw new Error('Login successful but server response is invalid (missing credentials).');
      }

      // 3. Update Global Store
      login(user, token);

      // 4. Safe UI Feedback (CRITICAL FIX FOR CRASH)
      // Force conversion to String to prevent "Object to Primitive" errors
      const safeFirstName = user.firstName ? String(user.firstName) : 'User';
      toast.success(`Welcome back, ${safeFirstName}!`);

      // 5. Intelligent Routing
      // Normalize role to ensure case-insensitivity matches
      const rawRole = user.role ? String(user.role).toUpperCase() : '';
      
      switch (rawRole) {
        case 'SUPER_ADMIN':
        case 'ADMIN':
          navigate('/dashboard');
          break;
        case 'TEACHER':
          navigate('/teacher/dashboard');
          break;
        case 'STUDENT':
          navigate('/student/dashboard');
          break;
        case 'PARENT':
          navigate('/parent/dashboard');
          break;
        default:
          // Fallback for unknown roles to prevent getting stuck on login
          console.warn(`Unknown role detected: ${rawRole}. Redirecting to default dashboard.`);
          navigate('/dashboard');
          break;
      }

    } catch (error: any) {
      console.error("Login Process Error:", error);
      
      // 6. Advanced Error Sanitization (The "Anti-Crash" Logic)
      let displayMsg = "An unexpected error occurred.";

      if (error.response) {
        // Server returned an error (4xx, 5xx)
        const data = error.response.data;
        
        if (data) {
            if (typeof data === 'string') {
                displayMsg = data;
            } else if (typeof data.message === 'string') {
                displayMsg = data.message;
            } else if (Array.isArray(data.errors)) {
                // If backend returns an array of validation errors
                displayMsg = data.errors.map((e: any) => 
                    typeof e === 'string' ? e : e.message || JSON.stringify(e)
                ).join(', ');
            } else if (typeof data.message === 'object') {
                // If message is an object, stringify it safely
                displayMsg = JSON.stringify(data.message);
            }
        } else {
            displayMsg = `Server Error (${error.response.status})`;
        }
      } else if (error.request) {
        // Request made but no response received
        displayMsg = "Cannot reach the server. Please check your internet connection.";
      } else if (error.message) {
        // Generic JS error
        displayMsg = String(error.message);
      }

      // Final Safety Net: Ensure strictly string type
      const safeErrorMsg = String(displayMsg);
      
      setErrorMessage(safeErrorMsg);
      toast.error(safeErrorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <Card className="w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-300">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold text-slate-900">School Portal</CardTitle>
          <CardDescription>Enter your credentials to access your account</CardDescription>
        </CardHeader>
        <CardContent>
          {errorMessage && (
            <div className="mb-4 flex items-start gap-2 rounded-md bg-red-50 p-3 text-sm text-red-600 border border-red-200 animate-in slide-in-from-top-2">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <span className="break-words font-medium">{errorMessage}</span>
            </div>
          )}
          
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="name@school.com"
                {...form.register('email')}
                disabled={isLoading}
                className="transition-all focus-visible:ring-indigo-500"
              />
              {form.formState.errors.email && (
                <p className="text-xs text-red-500 font-medium ml-1">{form.formState.errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="••••••••"
                {...form.register('password')}
                disabled={isLoading}
                className="transition-all focus-visible:ring-indigo-500"
              />
              {form.formState.errors.password && (
                <p className="text-xs text-red-500 font-medium ml-1">{form.formState.errors.password.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 transition-all shadow-md hover:shadow-lg" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}