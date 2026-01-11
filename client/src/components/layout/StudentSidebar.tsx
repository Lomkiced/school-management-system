// FILE: client/src/components/layout/StudentSidebar.tsx
import { LayoutDashboard, LineChart } from 'lucide-react';
import { SidebarShell } from './SidebarShell';

export const StudentSidebar = () => {
  const studentLinks = [
    { label: 'Dashboard', href: '/student/dashboard', icon: LayoutDashboard, color: 'text-indigo-500' },
    { label: 'My Grades', href: '/student/grades', icon: LineChart, color: 'text-orange-500' },
  ];

  return <SidebarShell title="Student Portal" links={studentLinks} colorTheme="orange" />;
};