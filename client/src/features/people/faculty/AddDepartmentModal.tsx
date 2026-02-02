import { useState } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Building2, AlignLeft } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../../lib/axios';

interface AddDepartmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onDepartmentAdded: () => void;
}

export const AddDepartmentModal = ({ isOpen, onClose, onDepartmentAdded }: AddDepartmentModalProps) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async () => {
        if (!name) {
            toast.error('Department name is required');
            return;
        }

        setIsLoading(true);
        try {
            await api.post('/departments', {
                name,
                description
            });
            toast.success('Department created successfully');
            onDepartmentAdded();
            onClose();
            setName('');
            setDescription('');
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Failed to create department');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Create New Department">
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Department Name *</label>
                    <div className="relative">
                        <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full pl-9 p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="e.g. Science Department"
                            autoFocus
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                    <div className="relative">
                        <AlignLeft className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full pl-9 p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none pt-2"
                            placeholder="Optional description..."
                        />
                    </div>
                </div>

                <div className="pt-4 flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                        {isLoading ? 'Creating...' : 'Create Department'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};
