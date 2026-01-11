// FILE: client/src/components/layout/Sidebar.tsx
import { BarChart3, GraduationCap, LayoutDashboard, Settings, Users, Wallet } from 'lucide-react';
import { SidebarShell } from './SidebarShell';

// Fix: Explicitly export the component so DashboardLayout can find it
export const Sidebar = () => {
  const adminLinks = [
    { label: 'Overview', href: '/dashboard', icon: LayoutDashboard, color: 'text-indigo-500' },
    { label: 'Students', href: '/students', icon: Users, color: 'text-blue-500' },
    { label: 'Teachers', href: '/teachers', icon: GraduationCap, color: 'text-emerald-500' },
    { label: 'Classes', href: '/classes', icon: BarChart3, color: 'text-orange-500' },
    { label: 'Finance', href: '/finance', icon: Wallet, color: 'text-purple-500' },
    { label: 'Settings', href: '/settings', icon: Settings, color: 'text-slate-500' },
  ];

  return <SidebarShell title="Admin Portal" links={adminLinks} colorTheme="indigo" />;
};