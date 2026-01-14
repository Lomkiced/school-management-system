// FILE: client/src/features/teachers/AddTeacher.tsx
// 2026 Standard: Teacher registration form with initial password

import { ArrowLeft, Eye, EyeOff, Info, Lock, Mail, Phone, User } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import api from '../../lib/axios';

export const AddTeacher = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    address: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const generatePassword = () => {
    // Generate a secure random password
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, password });
    setShowPassword(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validation
    if (!formData.password || formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setIsLoading(false);
      return;
    }

    try {
      await api.post('/teachers', formData);
      toast.success('Teacher registered successfully!', {
        description: `Initial password has been set. The teacher will need to change it on first login.`
      });
      navigate('/teachers');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create teacher');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto animate-in fade-in duration-500">
      <Button variant="ghost" onClick={() => navigate('/teachers')} className="gap-2">
        <ArrowLeft size={16} /> Back to List
      </Button>

      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Register New Teacher
          </CardTitle>
          <CardDescription className="text-indigo-100">
            Create login credentials for a new teacher account
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md flex items-center gap-2">
                <Info className="h-4 w-4" />
                {error}
              </div>
            )}

            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Personal Information</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">First Name *</label>
                  <Input
                    name="firstName"
                    required
                    onChange={handleChange}
                    value={formData.firstName}
                    placeholder="John"
                    className="border-slate-300"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Last Name *</label>
                  <Input
                    name="lastName"
                    required
                    onChange={handleChange}
                    value={formData.lastName}
                    placeholder="Doe"
                    className="border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <Phone className="h-4 w-4 text-slate-400" />
                    Phone Number
                  </label>
                  <Input
                    name="phone"
                    onChange={handleChange}
                    value={formData.phone}
                    placeholder="09123456789"
                    className="border-slate-300"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Address</label>
                  <Input
                    name="address"
                    onChange={handleChange}
                    value={formData.address}
                    placeholder="City, Province"
                    className="border-slate-300"
                  />
                </div>
              </div>
            </div>

            {/* Login Credentials */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Login Credentials</h3>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <Mail className="h-4 w-4 text-slate-400" />
                  Email Address *
                </label>
                <Input
                  name="email"
                  type="email"
                  required
                  onChange={handleChange}
                  value={formData.email}
                  placeholder="teacher@school.edu"
                  className="border-slate-300"
                />
                <p className="text-xs text-slate-500">This will be used as the login username</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <Lock className="h-4 w-4 text-slate-400" />
                  Initial Password *
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      onChange={handleChange}
                      value={formData.password}
                      placeholder="Minimum 6 characters"
                      className="border-slate-300 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <Button type="button" variant="outline" onClick={generatePassword}>
                    Generate
                  </Button>
                </div>
                <p className="text-xs text-slate-500">
                  The teacher should change this password upon first login
                </p>
              </div>

              {/* Password Info Box */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <Info className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-amber-800">Important: Share credentials securely</p>
                    <p className="text-amber-700 mt-1">
                      Please share the email and initial password with the teacher privately.
                      Remind them to change their password immediately after their first login.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Registering...
                </>
              ) : (
                'Complete Registration'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddTeacher;