import { Command } from "cmdk";
import { BookOpen, CreditCard, LayoutDashboard, Search, Settings, User } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../lib/axios";

export const SearchCommand = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [students, setStudents] = useState<any[]>([]);

  // 1. Toggle with Keyboard Shortcut (Cmd+K or Ctrl+K)
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    
    // Pre-fetch students for fast search
    api.get('/students').then(res => setStudents(res.data.data)).catch(() => {});

    return () => document.removeEventListener("keydown", down);
  }, []);

  // 2. Navigation Helper
  const runCommand = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-[20vh] transition-all">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 p-2">
        <Command className="w-full">
            
          <div className="flex items-center border-b px-3" cmdk-input-wrapper="">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Command.Input 
              placeholder="Type a command or search students..." 
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-slate-500 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <Command.List className="max-h-[300px] overflow-y-auto overflow-x-hidden py-2">
            <Command.Empty className="py-6 text-center text-sm text-slate-500">No results found.</Command.Empty>

            <Command.Group heading="Pages" className="px-2 py-1.5 text-xs font-medium text-slate-500">
              <Command.Item onSelect={() => runCommand('/dashboard')} className="flex items-center gap-2 px-2 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded cursor-pointer transition-colors">
                <LayoutDashboard size={14} /> Dashboard
              </Command.Item>
              <Command.Item onSelect={() => runCommand('/classes')} className="flex items-center gap-2 px-2 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded cursor-pointer transition-colors">
                <BookOpen size={14} /> Classes
              </Command.Item>
              <Command.Item onSelect={() => runCommand('/finance')} className="flex items-center gap-2 px-2 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded cursor-pointer transition-colors">
                <CreditCard size={14} /> Finance
              </Command.Item>
              <Command.Item onSelect={() => runCommand('/settings')} className="flex items-center gap-2 px-2 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded cursor-pointer transition-colors">
                <Settings size={14} /> Settings
              </Command.Item>
            </Command.Group>

            <Command.Separator className="my-1 h-px bg-slate-200" />

            <Command.Group heading="Students" className="px-2 py-1.5 text-xs font-medium text-slate-500">
              {students.slice(0, 5).map(student => (
                 <Command.Item 
                    key={student.id} 
                    onSelect={() => runCommand(`/students/${student.id}/ledger`)}
                    className="flex items-center gap-2 px-2 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded cursor-pointer transition-colors"
                 >
                    <User size={14} /> {student.lastName}, {student.firstName}
                 </Command.Item>
              ))}
            </Command.Group>

          </Command.List>
        </Command>
      </div>
    </div>
  );
};