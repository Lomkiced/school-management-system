import { Outlet } from 'react-router-dom';
import ParentSidebar from './ParentSidebar';

export default function ParentLayout() {
  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden">
      <aside className="hidden md:block">
        <ParentSidebar />
      </aside>
      <main className="flex-1 overflow-y-auto p-8">
        <div className="mx-auto max-w-7xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}