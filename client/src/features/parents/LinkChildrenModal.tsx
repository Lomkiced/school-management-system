// FILE: client/src/features/parents/LinkChildrenModal.tsx
import { Check, Link as LinkIcon, Loader2, Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import api from '../../lib/axios';
import { cn } from '../../lib/utils';

interface LinkChildrenModalProps {
  parentId: string;
  parentName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const LinkChildrenModal = ({ parentId, parentName, onClose, onSuccess }: LinkChildrenModalProps) => {
  const [search, setSearch] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Search Students
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!search) {
        setStudents([]);
        return;
      }
      try {
        setIsLoading(true);
        // Reuse student list API with search
        const res = await api.get(`/students?search=${search}&limit=5`);
        if (res.data.success) {
          setStudents(res.data.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handleSave = async () => {
    if (selectedIds.size === 0) return;
    try {
      setIsSaving(true);
      await api.post(`/parents/${parentId}/link`, { studentIds: Array.from(selectedIds) });
      toast.success('Children linked successfully');
      onSuccess();
    } catch (err: any) {
      toast.error("Failed to link children");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200">
        
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Link Children</h2>
            <p className="text-xs text-slate-500">Connecting students to <span className="font-semibold text-indigo-600">{parentName}</span></p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input 
              autoFocus
              placeholder="Search student by name..." 
              className="pl-9 bg-white"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {isLoading ? (
            <div className="py-8 flex justify-center text-slate-400"><Loader2 className="animate-spin" /></div>
          ) : students.length === 0 && search ? (
            <div className="py-8 text-center text-sm text-slate-500">No students found.</div>
          ) : students.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400 flex flex-col items-center gap-2">
              <Search size={24} className="opacity-20" />
              Start typing to find students
            </div>
          ) : (
            <div className="space-y-1">
              {students.map(student => (
                <div 
                  key={student.id}
                  onClick={() => toggleSelection(student.id)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors border",
                    selectedIds.has(student.id) 
                      ? "bg-indigo-50 border-indigo-200" 
                      : "bg-white border-transparent hover:bg-slate-50"
                  )}
                >
                  <div className={cn(
                    "h-5 w-5 rounded border flex items-center justify-center transition-colors",
                    selectedIds.has(student.id) ? "bg-indigo-600 border-indigo-600" : "border-slate-300"
                  )}>
                    {selectedIds.has(student.id) && <Check size={12} className="text-white" />}
                  </div>
                  <div>
                    <div className="font-medium text-slate-900">{student.firstName} {student.lastName}</div>
                    <div className="text-xs text-slate-500">{student.user.email}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={handleSave} 
            disabled={selectedIds.size === 0 || isSaving}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {isSaving ? <Loader2 className="animate-spin h-4 w-4" /> : <><LinkIcon className="mr-2 h-4 w-4" /> Link Selected</>}
          </Button>
        </div>
      </div>
    </div>
  );
};