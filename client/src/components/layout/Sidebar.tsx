// FILE: client/src/components/layout/Sidebar.tsx
import {
  BookOpen,
  CalendarCheck,
  DollarSign,
  GraduationCap,
  LayoutDashboard,
  Settings,
  Users,
  Users2
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { SidebarShell } from './SidebarShell';

export const Sidebar = () => {
  const { user } = useAuthStore();
  const role = user?.role || 'GUEST';

  // --- 1. Define Menus per Role ---
  const MENUS = {
    ADMIN: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/students', label: 'Students', icon: GraduationCap },
      { href: '/teachers', label: 'Teachers', icon: Users },
      { href: '/parents', label: 'Parents', icon: Users2 },
      { href: '/classes', label: 'Classes', icon: BookOpen },
      { href: '/finance', label: 'Finance', icon: DollarSign },
      { href: '/settings', label: 'Settings', icon: Settings },
    ],
    TEACHER: [
      { href: '/teacher/dashboard', label: 'Overview', icon: LayoutDashboard },
      // Teachers see their specific classes on the dashboard usually, 
      // but we can add direct links if needed.
    ],
    STUDENT: [
      { href: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/student/grades', label: 'My Grades', icon: CalendarCheck },
    ],
    PARENT: [
      { href: '/parent/dashboard', label: 'Family Overview', icon: Users2 },
    ]
  };

  // --- 2. Select the correct menu ---
  // @ts-ignore - Ignore TS error if role doesn't match specific key
  const links = MENUS[role] || MENUS.ADMIN; 

  // --- 3. Render the Shell ---
  // The Shell handles the UI (Logo, Logout button, CSS styles)
  // We just pass the data (links)
  return <SidebarShell links={links} />;
};