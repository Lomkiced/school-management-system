// FILE: client/src/components/layout/TeacherSidebar.tsx
import { BookOpen, LayoutDashboard } from 'lucide-react';
import { SidebarShell } from './SidebarShell';

export const TeacherSidebar = () => {
  const teacherLinks = [
    { label: 'Dashboard', href: '/teacher/dashboard', icon: LayoutDashboard, color: 'text-indigo-500' },
    { label: 'My Classes', href: '/teacher/classes', icon: BookOpen, color: 'text-emerald-500' },
    // Note: Quiz creation is accessed via Classes/Gradebook, so we keep the sidebar clean
  ];

  return <SidebarShell title="Teacher Portal" links={teacherLinks} colorTheme="emerald" />;
};