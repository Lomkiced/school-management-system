// FILE: client/src/components/layout/ParentSidebar.tsx
import { CreditCard, LayoutDashboard, LineChart, Users } from 'lucide-react';
import { SidebarShell } from './SidebarShell';

// === CRITICAL FIX: EXPORT NAMED COMPONENT ===
export const ParentSidebar = () => {
  const parentLinks = [
    { label: 'Dashboard', href: '/parent/dashboard', icon: LayoutDashboard, color: 'text-indigo-500' },
    { label: 'My Children', href: '/parent/children', icon: Users, color: 'text-blue-500' },
    { label: 'Academic Records', href: '/parent/academics', icon: LineChart, color: 'text-emerald-500' },
    { label: 'Fees & Payments', href: '/parent/finance', icon: CreditCard, color: 'text-orange-500' },
  ];

  // We use the "Slate" theme to distinguish Parents from Teachers/Admins
  return <SidebarShell title="Parent Portal" links={parentLinks} colorTheme="slate" />;
};