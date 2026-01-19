// FILE: client/src/features/auth/LoginForm.tsx
// 2026 Standard: Interactive Landing Page with integrated Login

import { zodResolver } from '@hookform/resolvers/zod';
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  Library,
  Lightbulb,
  Loader2,
  Lock,
  Mail,
  Menu,
  School,
  Sparkles,
  Trophy,
  Users,
  X
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useAuthStore } from '../../store/authStore';
import { cn } from '../../lib/utils';

// --- Login Schema ---
const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type LoginValues = z.infer<typeof loginSchema>;

// --- Components ---

const FeatureCard = ({ icon: Icon, title, desc, delay }: { icon: any, title: string, desc: string, delay: string }) => (
  <div
    className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-indigo-50 hover:shadow-xl hover:scale-105 transition-all duration-300 group"
    style={{ animationDelay: delay }}
  >
    <div className="h-12 w-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
      <Icon size={24} className="group-hover:animate-bounce" />
    </div>
    <h3 className="font-bold text-lg mb-2 text-slate-800">{title}</h3>
    <p className="text-slate-600 text-sm">{desc}</p>
  </div>
);

const StatItem = ({ count, label, icon: Icon }: { count: string, label: string, icon: any }) => (
  <div className="flex flex-col items-center p-4">
    <div className="mb-2 text-indigo-400">
      <Icon size={24} />
    </div>
    <h4 className="text-3xl font-bold text-white mb-1">{count}</h4>
    <p className="text-indigo-200 text-sm font-medium uppercase tracking-wider">{label}</p>
  </div>
);

export const LoginForm = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [error, setError] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' }
  });

  const onSubmit = async (values: LoginValues) => {
    try {
      setError(null);
      const user = await login(values);
      toast.success(`Welcome back, ${user.name}! 🚀`);

      // Role-based redirect
      const routes = {
        ADMIN: '/dashboard',
        TEACHER: '/teacher/dashboard',
        STUDENT: '/student/dashboard',
        PARENT: '/parent/dashboard',
        SUPER_ADMIN: '/dashboard'
      };
      navigate(routes[user.role as keyof typeof routes] || '/dashboard');
    } catch (err: any) {
      console.error("Login Error:", err);
      setError(err.response?.data?.message || "Invalid credentials.");
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-indigo-100 overflow-x-hidden scroll-smooth">

      {/* --- NAVBAR --- */}
      <nav className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled ? "bg-white/90 backdrop-blur-md shadow-sm py-3" : "bg-transparent py-5"
      )}>
        <div className="container mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl text-indigo-600 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="p-2 bg-indigo-600 rounded-lg text-white group-hover:rotate-12 transition-transform">
              <BookOpen size={20} />
            </div>
            <span className={cn("text-slate-900", !scrolled && "text-slate-900")}>
              School<span className="text-indigo-600">Admin</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {[
              { name: 'About', id: 'about' },
              { name: 'Academics', id: 'academics' },
              { name: 'Admissions', id: 'admissions' },
              { name: 'Contact', id: 'contact' }
            ].map((item) => (
              <button
                key={item.name}
                onClick={() => document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' })}
                className={cn(
                  "text-sm font-medium hover:text-indigo-600 transition-colors relative group cursor-pointer",
                  scrolled ? "text-slate-600" : "text-slate-600"
                )}
              >
                {item.name}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-indigo-600 transition-all group-hover:w-full" />
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => document.getElementById('login-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200"
            >
              Access Portal
            </Button>

            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden p-2 text-slate-600"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="relative min-h-screen pt-20 flex items-center justify-center overflow-hidden">
        {/* Background Blobs */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-300/30 rounded-full blur-[100px] animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-300/30 rounded-full blur-[100px] animate-pulse delay-1000" />
          <div className="absolute top-[30%] left-[40%] w-[300px] h-[300px] bg-pink-300/20 rounded-full blur-[80px] animate-bounce duration-[10s]" />

          {/* Grid Pattern */}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
        </div>

        <div className="container mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">

          {/* Left Content */}
          <div className="space-y-8 animate-in slide-in-from-left-10 duration-700">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium border border-indigo-100">
              <Sparkles size={16} className="text-amber-500 fill-amber-500" />
              New Admissions Open for 2026
            </div>

            <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 leading-tight">
              Shaping the <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Future</span> of Education
            </h1>

            <p className="text-lg text-slate-600 leading-relaxed max-w-lg">
              Empowering students, teachers, and parents with a world-class portal. Experience seamless learning, real-time tracking, and community engagement.
            </p>

            <div className="flex flex-wrap gap-4">
              <Button size="lg" className="h-12 px-8 text-base bg-indigo-600 hover:bg-indigo-700">
                Explore Programs <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" className="h-12 px-8 text-base border-slate-300 hover:bg-slate-50">
                View Campus Tour
              </Button>
            </div>

            <div className="flex items-center gap-4 pt-4">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className={`w-10 h-10 rounded-full border-2 border-white bg-slate-200 overflow-hidden flex items-center justify-center text-xs font-bold bg-gradient-to-br from-indigo-${i}00 to-purple-${i}00 text-white`}>
                    {['JD', 'AS', 'MR', '+'][i - 1]}
                  </div>
                ))}
              </div>
              <div className="text-sm">
                <p className="font-bold text-slate-900">2,500+</p>
                <p className="text-slate-500">Students Joined</p>
              </div>
            </div>
          </div>

          {/* Right Login Card */}
          <div className="relative z-10 animate-in slide-in-from-right-10 duration-700 delay-200" id="login-section">
            <div className="absolute inset-0 bg-indigo-600 blur-[60px] opacity-10 rounded-full transform rotate-12 scale-110" />

            <div className="bg-white/70 backdrop-blur-xl border border-white/50 p-8 rounded-3xl shadow-2xl relative">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-indigo-200 transform hover:rotate-6 transition-transform">
                  <Lock size={32} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Portal Login</h2>
                <p className="text-slate-500 text-sm mt-1">Students, Teachers & Parents</p>
              </div>

              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                {error && (
                  <div className="bg-red-50/80 backdrop-blur text-red-600 p-3 rounded-xl flex items-center gap-3 text-sm animate-pulse border border-red-100">
                    <AlertCircle size={18} /> {error}
                  </div>
                )}

                <div className="space-y-4">
                  <div className="relative group">
                    <Mail className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                    <Input
                      placeholder="Email Address"
                      className="pl-12 h-12 bg-white/50 border-slate-200 focus:bg-white transition-all rounded-xl"
                      {...form.register('email')}
                    />
                  </div>

                  <div className="relative group">
                    <Lock className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                    <Input
                      type="password"
                      placeholder="Password"
                      className="pl-12 h-12 bg-white/50 border-slate-200 focus:bg-white transition-all rounded-xl"
                      {...form.register('password')}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                  <label className="flex items-center gap-2 cursor-pointer hover:text-indigo-600 transition-colors">
                    <input type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-500" />
                    Remember me
                  </label>
                  <a href="#" className="hover:text-indigo-600 transition-colors">Forgot Password?</a>
                </div>

                <Button className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-lg shadow-lg hover:shadow-indigo-300 transition-all rounded-xl" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? <Loader2 className="animate-spin" /> : "Sign In"}
                </Button>

                <p className="text-center text-xs text-slate-400 mt-4">
                  Powered by SchoolAdmin Pro v2.0
                </p>
              </form>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce hidden md:block text-slate-400">
          <div className="w-6 h-10 border-2 border-slate-300 rounded-full flex justify-center p-1">
            <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-ping" />
          </div>
        </div>
      </section>

      {/* --- FEATURES SCROLL --- */}
      <section className="py-20 bg-slate-50/50" id="about">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Why Choose Us?</h2>
            <p className="text-slate-600">We provide an environment that fosters growth, innovation, and character development for every student.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={Library}
              title="Academic Excellence"
              desc="Comprehensive curriculum designed to challenge and inspire students at every level."
              delay="0ms"
            />
            <FeatureCard
              icon={Trophy}
              title="Sports & Arts"
              desc="State-of-the-art facilities for sports and creative arts to nurture holistic growth."
              delay="100ms"
            />
            <FeatureCard
              icon={Users}
              title="Community"
              desc="A vibrant community of learners, educators, and parents working together."
              delay="200ms"
            />
          </div>
        </div>
      </section>

      {/* --- ACADEMICS SECTION --- */}
      <section className="py-20 bg-white" id="academics">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Academic Programs</h2>
            <p className="text-slate-600">From primary to senior high, we offer comprehensive programs designed for excellence.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="p-6 border border-slate-200 rounded-xl hover:shadow-lg transition-all">
              <Lightbulb className="h-10 w-10 text-indigo-600 mb-4" />
              <h3 className="font-bold text-lg mb-2 text-slate-800">STEM Track</h3>
              <p className="text-slate-600 text-sm">Advanced science, technology, engineering & mathematics curriculum.</p>
            </div>
            <div className="p-6 border border-slate-200 rounded-xl hover:shadow-lg transition-all">
              <CheckCircle2 className="h-10 w-10 text-emerald-600 mb-4" />
              <h3 className="font-bold text-lg mb-2 text-slate-800">Humanities</h3>
              <p className="text-slate-600 text-sm">Social sciences, languages, and liberal arts programs.</p>
            </div>
          </div>
        </div>
      </section>

      {/* --- ADMISSIONS SECTION --- */}
      <section className="py-20 bg-slate-50/50" id="admissions">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Ready to Join?</h2>
            <p className="text-slate-600 mb-8">Applications for Academic Year 2026-2027 are now open.</p>
            <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700">
              Apply Now <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* --- STATS BAR --- */}
      <section className="py-16 bg-indigo-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10" />
        <div className="container mx-auto px-6 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatItem count="98%" label="Graduation Rate" icon={GraduationCap} />
            <StatItem count="50+" label="Certified Teachers" icon={School} />
            <StatItem count="12:1" label="Student-Teacher Ratio" icon={Users} />
            <StatItem count="100+" label="Awards Won" icon={Trophy} />
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="container mx-auto px-6 grid md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 text-white font-bold text-xl mb-4">
              <BookOpen className="text-indigo-500" /> SchoolAdmin
            </div>
            <p className="max-w-xs text-sm">
              Empowering the next generation of leaders through excellence in education and character building.
            </p>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-indigo-400">About Us</a></li>
              <li><a href="#" className="hover:text-indigo-400">Admissions</a></li>
              <li><a href="#" className="hover:text-indigo-400">Campus Life</a></li>
              <li><a href="#" className="hover:text-indigo-400">News & Events</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Contact</h4>
            <ul className="space-y-2 text-sm">
              <li>123 Education Lane</li>
              <li>Cityville, State 12345</li>
              <li>info@schooladmin.com</li>
              <li>(555) 123-4567</li>
            </ul>
          </div>
        </div>
        <div className="container mx-auto px-6 mt-12 pt-8 border-t border-slate-800 text-xs text-center">
          © 2026 AdminSchool System. All rights reserved.
        </div>
      </footer>

      {/* --- CONTACT SECTION (Embedded in Footer) --- */}
      <div id="contact" className="h-0" />

    </div>
  );
};

export default LoginForm;