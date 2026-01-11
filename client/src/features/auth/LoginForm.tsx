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
    console.log("🚀 STARTING LOGIN...");

    try {
      // 1. Send Request
      const response = await api.post('/auth/login', {
        email: data.email.trim(),
        password: data.password.trim()
      });

      console.log("📥 Raw Response:", response);

      // 2. SMART DATA EXTRACTION (The Fix)
      // This handles if axios interceptors are used OR not used
      const responseData = response.data || response;
      
      // Look for user/token in different common places
      const user = responseData.user || responseData.data?.user;
      const token = responseData.token || responseData.data?.token;

      console.log("🕵️ Extracted Data:", { user, token });

      // 3. Validation
      if (!user || !token) {
        console.error("❌ Data missing from response. Structure received:", responseData);
        throw new Error("Server response was successful but missing User or Token data.");
      }

      // 4. Save to Store
      login(user, token);
      toast.success(`Welcome back, ${user.firstName || 'User'}!`);

      // 5. Case-Insensitive Routing
      // We convert role to UPPERCASE to be safe
      const role = (user.role || '').toUpperCase();
      console.log("🧭 Routing for Role:", role);

      switch (role) {
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
          console.warn("⚠️ Unknown role:", role);
          navigate('/');
      }

    } catch (error: any) {
      console.error("🔥 LOGIN CRASH:", error);
      
      let msg = "An unexpected error occurred.";
      
      if (error.response) {
        // Server responded with 400/401/500
        msg = error.response.data?.message || `Server Error (${error.response.status})`;
      } else if (error.request) {
        // Server unreachable
        msg = "Cannot connect to server. Is the backend running?";
      } else {
        // Code error
        msg = error.message;
      }
      
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold text-slate-900">School Portal</CardTitle>
          <CardDescription>Enter your credentials to access your account</CardDescription>
        </CardHeader>
        <CardContent>
          {errorMessage && (
            <div className="mb-4 flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-600 border border-red-200">
              <AlertCircle className="h-4 w-4" />
              {errorMessage}
            </div>
          )}
          
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="name@school.com"
                {...form.register('email')}
                disabled={isLoading}
              />
              {form.formState.errors.email && (
                <p className="text-xs text-red-500">{form.formState.errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="••••••••"
                {...form.register('password')}
                disabled={isLoading}
              />
              {form.formState.errors.password && (
                <p className="text-xs text-red-500">{form.formState.errors.password.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800" disabled={isLoading}>
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