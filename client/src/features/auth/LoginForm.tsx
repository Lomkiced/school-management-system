// FILE: client/src/features/auth/LoginForm.tsx
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Loader2, Lock, Mail } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { useAuthStore } from '../../store/authStore';

// Strict Validation Schema
const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type LoginValues = z.infer<typeof loginSchema>;

export const LoginForm = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' }
  });

  const onSubmit = async (values: LoginValues) => {
    try {
      setError(null);
      
      // 1. Perform Login & Wait for Result
      // We use the returned user object to guarantee we have data before redirecting
      const user = await login(values);

      toast.success(`Welcome back, ${user.name}`);

      // 2. Intelligent Redirect based on Role
      switch (user.role) {
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
          navigate('/dashboard'); // Fallback
      }

    } catch (err: any) {
      console.error("Login Error:", err);
      // Extract nice error message from Axios response if available
      const message = err.response?.data?.message || err.message || "Invalid credentials. Please try again.";
      setError(message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md shadow-xl border-slate-200">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold text-slate-900">Sign in to your account</CardTitle>
          <CardDescription>
            Enter your email and password below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md flex items-center gap-3 text-sm animate-in fade-in slide-in-from-top-1">
                <AlertCircle size={18} className="shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="name@school.com" 
                  className="pl-10" 
                  {...form.register('email')}
                  disabled={form.formState.isSubmitting}
                />
              </div>
              {form.formState.errors.email && (
                <p className="text-sm text-red-500 pl-1">{form.formState.errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input 
                  type="password" 
                  placeholder="Password" 
                  className="pl-10" 
                  {...form.register('password')}
                  disabled={form.formState.isSubmitting}
                />
              </div>
              {form.formState.errors.password && (
                <p className="text-sm text-red-500 pl-1">{form.formState.errors.password.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 transition-all" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="text-center text-sm text-slate-500 justify-center">
          Protected by School Management System Security
        </CardFooter>
      </Card>
    </div>
  );
};