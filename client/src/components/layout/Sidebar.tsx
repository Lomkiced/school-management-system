// FILE: client/src/components/layout/Sidebar.tsx
// 2026 Standard: Role-based navigation with comprehensive menus

import {
  BookOpen,
  CalendarCheck,
  ClipboardList,
  DollarSign,
  GraduationCap,
  LayoutDashboard,
  MessageSquare,
  Settings,
  Users,
  Users2
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { SidebarShell } from './SidebarShell';

export const Sidebar = () => {
  const { user } = useAuthStore();
  const role = user?.role || 'GUEST';

  // Define Menus per Role
  const MENUS: Record<string, { href: string; label: string; icon: any }[]> = {
    SUPER_ADMIN: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/students', label: 'Students', icon: GraduationCap },
      { href: '/teachers', label: 'Teachers', icon: Users },
      { href: '/parents', label: 'Parents', icon: Users2 },
      { href: '/classes', label: 'Classes', icon: BookOpen },
      { href: '/finance', label: 'Finance', icon: DollarSign },
      { href: '/settings', label: 'Settings', icon: Settings },
    ],
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
      { href: '/teacher/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/teacher/classes', label: 'My Classes', icon: BookOpen },
      { href: '/teacher/grades', label: 'Gradebook', icon: ClipboardList },
    ],
    STUDENT: [
      { href: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/student/classes', label: 'My Classes', icon: BookOpen },
      { href: '/student/grades', label: 'My Grades', icon: CalendarCheck },
    ],
    PARENT: [
      { href: '/parent/dashboard', label: 'Family Overview', icon: Users2 },
      { href: '/parent/children', label: 'My Children', icon: GraduationCap },
    ]
  };

  // Select the correct menu
  const links = MENUS[role] || MENUS.STUDENT;

  return <SidebarShell links={links} />;
};