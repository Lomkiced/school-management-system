// FILE: client/src/features/parents/ParentList.tsx
import {
  Edit,
  Phone,
  Plus,
  Search,
  Trash2,
  Users
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Skeleton } from '../../components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import api from '../../lib/axios';
import { AddParentModal } from './AddParentModal';
import { EditParentModal } from './EditParentModal';
import { LinkChildrenModal } from './LinkChildrenModal';

export const ParentList = () => {
  const [parents, setParents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [linkingParent, setLinkingParent] = useState<{ id: string, name: string } | null>(null);
  const [editingParent, setEditingParent] = useState<any | null>(null);

  const fetchParents = async () => {
    try {
      setIsLoading(true);
      const res = await api.get(`/parents?search=${searchTerm}`);
      if (res.data.success) {
        setParents(res.data.data);
      }
    } catch (err) {
      toast.error("Failed to load parents");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => fetchParents(), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this parent? Their children will NOT be deleted, just unlinked.")) return;
    try {
      await api.delete(`/parents/${id}`);
      setParents(prev => prev.filter(p => p.id !== id));
      toast.success("Parent deleted");
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Parent Directory</h1>
          <p className="text-slate-500 text-sm mt-1">Manage guardians and family connections.</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="bg-indigo-600 hover:bg-indigo-700 shadow-sm">
          <Plus className="mr-2 h-4 w-4" /> Add Parent
        </Button>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 flex gap-4 shadow-sm">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search name, email or phone..."
            className="pl-9 border-slate-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Data Grid */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-6">Parent Name</TableHead>
                <TableHead>Contact Info</TableHead>
                <TableHead>Children (Linked)</TableHead>
                <TableHead className="text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(3)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="pl-6"><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : parents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center text-slate-500 text-sm">
                    No parents found. Click "Add Parent" to create one.
                  </TableCell>
                </TableRow>
              ) : (
                parents.map((parent) => (
                  <TableRow key={parent.id} className="group hover:bg-slate-50 transition-colors">
                    <TableCell className="pl-6">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs border border-slate-200">
                          {parent.firstName[0]}{parent.lastName[0]}
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">{parent.lastName}, {parent.firstName}</div>
                          <div className="text-xs text-slate-500">{parent.user.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Phone className="h-3 w-3 text-slate-400" /> {parent.phone || "N/A"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1.5 items-center">
                        {parent.students.length > 0 ? (
                          parent.students.map((s: any) => (
                            <span key={s.id} className="inline-flex items-center bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full text-xs font-medium border border-indigo-100">
                              {s.firstName} {s.lastName}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 text-xs italic">No children linked</span>
                        )}
                        <button
                          onClick={() => setLinkingParent({ id: parent.id, name: `${parent.firstName} ${parent.lastName}` })}
                          className="opacity-0 group-hover:opacity-100 transition-opacity bg-white hover:bg-slate-100 text-slate-500 border border-slate-200 rounded-full p-1 shadow-sm"
                          title="Link Child"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-indigo-600 hover:bg-indigo-50"
                          onClick={() => setEditingParent(parent)}
                          title="Edit Details"
                        >
                          <Edit size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-emerald-600 hover:bg-emerald-50"
                          onClick={() => setLinkingParent({ id: parent.id, name: `${parent.firstName} ${parent.lastName}` })}
                          title="Manage Family"
                        >
                          <Users size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleDelete(parent.id)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modals */}
      {showAddModal && (
        <AddParentModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => { setShowAddModal(false); fetchParents(); }}
        />
      )}

      {linkingParent && (
        <LinkChildrenModal
          parentId={linkingParent.id}
          parentName={linkingParent.name}
          onClose={() => setLinkingParent(null)}
          onSuccess={() => { setLinkingParent(null); fetchParents(); }}
        />
      )}

      {editingParent && (
        <EditParentModal
          parent={editingParent}
          onClose={() => setEditingParent(null)}
          onSuccess={() => fetchParents()}
        />
      )}
    </div>
  );
};