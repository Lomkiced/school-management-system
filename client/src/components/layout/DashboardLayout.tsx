import { Outlet } from 'react-router-dom';
import { SchoolAI } from '../../features/ai/SchoolAI';
import { Sidebar } from './Sidebar';

const DashboardLayout = () => {
  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      <Sidebar />
      <main className="flex-1 ml-64 overflow-y-auto h-full">
        <div className="max-w-7xl mx-auto p-8 animate-in fade-in duration-500">
          <Outlet />
        </div>
      </main>
      <SchoolAI />
    </div>
  );
};
export default DashboardLayout;