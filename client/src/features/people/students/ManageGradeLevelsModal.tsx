import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, GripVertical, AlertCircle } from 'lucide-react';
import api from '../../../lib/axios';
import { toast } from 'sonner';

interface ManageGradeLevelsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpdate: () => void;
}

export const ManageGradeLevelsModal: React.FC<ManageGradeLevelsModalProps> = ({ isOpen, onClose, onUpdate }) => {
    const [levels, setLevels] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // New Level State
    const [newLabel, setNewLabel] = useState('');
    const [newValue, setNewValue] = useState<number>(0);
    const [newCategory, setNewCategory] = useState('Elementary');

    useEffect(() => {
        if (isOpen) fetchLevels();
    }, [isOpen]);

    const fetchLevels = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/grade-levels');
            setLevels(res.data.data);

            // Auto-set next value logic
            if (res.data.data.length > 0) {
                const maxVal = Math.max(...res.data.data.map((l: any) => l.value));
                setNewValue(maxVal + 1);
            } else {
                setNewValue(1);
            }
        } catch (e) {
            toast.error('Failed to load grade levels');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAdd = async () => {
        if (!newLabel) return toast.error('Label is required');

        try {
            await api.post('/grade-levels', {
                label: newLabel,
                value: Number(newValue),
                category: newCategory,
                order: Number(newValue) // Default order to match value for now
            });
            toast.success('Grade level added');
            setNewLabel('');
            setNewValue(prev => prev + 1);
            fetchLevels();
            onUpdate();
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Failed to add level');
        }
    };

    const handleDelete = async (id: string, label: string) => {
        if (!confirm(`Are you sure you want to delete ${label}?`)) return;

        try {
            await api.delete(`/grade-levels/${id}`);
            toast.success('Grade level removed');
            fetchLevels();
            onUpdate();
        } catch (e) {
            toast.error('Failed to delete level');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden">

                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Manage Grade Levels</h2>
                        <p className="text-sm text-slate-500">Add or remove distinct academic levels</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    {/* Add New Form */}
                    <div className="bg-indigo-50/50 rounded-xl p-4 border border-indigo-100 mb-6">
                        <h3 className="text-xs font-bold uppercase text-indigo-600 tracking-wider mb-3">Add New Level</h3>
                        <div className="flex gap-3 mb-3">
                            <input
                                type="text"
                                placeholder="Display Name (e.g. Grade 13)"
                                value={newLabel}
                                onChange={e => setNewLabel(e.target.value)}
                                className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                            <select
                                value={newCategory}
                                onChange={e => setNewCategory(e.target.value)}
                                className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                            >
                                <option value="Preschool">Preschool</option>
                                <option value="Elementary">Elementary</option>
                                <option value="Junior High">Junior High</option>
                                <option value="Senior High">Senior High</option>
                                <option value="College">College</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex-1 flex items-center gap-2 text-xs text-slate-500">
                                <span>Level Value:</span>
                                <input
                                    type="number"
                                    value={newValue}
                                    onChange={e => setNewValue(Number(e.target.value))}
                                    className="w-16 px-2 py-1 rounded border border-slate-200 text-center font-mono"
                                />
                                <span className="text-[10px] text-slate-400">(Used for logic)</span>
                            </div>
                            <button
                                onClick={handleAdd}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg flex items-center gap-2 transition-all shadow-sm"
                            >
                                <Plus size={16} /> Add Level
                            </button>
                        </div>
                    </div>

                    {/* List */}
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                        {isLoading ? (
                            <div className="text-center py-8 text-slate-400">Loading...</div>
                        ) : levels.map((l) => (
                            <div key={l.id} className="group flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl hover:border-indigo-200 hover:shadow-sm transition-all">
                                <div className="flex items-center gap-3">
                                    <div className="cursor-grab text-slate-300 hover:text-slate-500">
                                        <GripVertical size={16} />
                                    </div>
                                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                                        {l.value}
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-800 text-sm">{l.label}</div>
                                        <div className="text-[10px] text-slate-500 uppercase tracking-wide">{l.category}</div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDelete(l.id, l.label)}
                                    className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center gap-3 text-xs text-slate-500">
                    <AlertCircle size={14} />
                    <p>Deleting a level does not delete students, but hides the folder.</p>
                </div>
            </div>
        </div>
    );
};
