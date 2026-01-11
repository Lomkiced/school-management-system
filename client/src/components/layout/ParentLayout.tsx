// client/src/components/layout/ParentLayout.tsx
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

const ParentLayout = () => {
  return (
    <div className="flex bg-slate-50 min-h-screen font-sans">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 animate-in fade-in duration-500">
        <div className="max-w-5xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
export default ParentLayout;