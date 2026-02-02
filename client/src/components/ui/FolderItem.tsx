// FILE: client/src/components/ui/FolderItem.tsx
import { Folder, Users, ChevronRight } from 'lucide-react';

interface FolderItemProps {
    label: string;
    subLabel?: string;
    onClick: () => void;
    color?: string; // Tailwind color class e.g. "text-indigo-600"
    count?: number; // Badge count
    variant?: 'default' | 'glass' | 'minimal';
}

export const FolderItem = ({
    label,
    subLabel,
    onClick,
    color = "text-amber-400",
    count,
    variant = 'default'
}: FolderItemProps) => {

    if (variant === 'glass') {
        return (
            <div
                onClick={onClick}
                className="group relative overflow-hidden bg-white/80 backdrop-blur-sm border border-white/20 shadow-sm hover:shadow-xl rounded-2xl p-5 cursor-pointer transition-all duration-300 hover:-translate-y-1"
            >
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Folder className={`w-32 h-32 ${color}`} />
                </div>

                <div className="relative z-10 flex flex-col h-full justify-between">
                    <div className={`p-3 w-fit rounded-xl ${color.replace('text-', 'bg-').replace('600', '100').replace('500', '100').replace('400', '100')} ${color}`}>
                        <Folder size={24} />
                    </div>

                    <div className="mt-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-slate-800 text-lg group-hover:text-indigo-600 transition-colors">{label}</h3>
                            {count !== undefined && (
                                <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold flex items-center gap-1">
                                    <Users size={12} /> {count}
                                </span>
                            )}
                        </div>
                        {subLabel && <p className="text-sm text-slate-500 mt-1">{subLabel}</p>}
                    </div>
                </div>

                {/* Decorative sheen */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </div>
        );
    }

    // Default legacy style (enhanced)
    return (
        <div
            onClick={onClick}
            className="group flex flex-col items-center p-6 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md cursor-pointer transition-all duration-300 hover:-translate-y-1 relative overflow-hidden"
        >
            <div className={`absolute top-0 left-0 w-full h-1 ${color.replace('text-', 'bg-').replace('400', '500').replace('600', '500')}`} />

            <div className="relative mb-3">
                <Folder
                    fill="currentColor"
                    className={`${color} w-20 h-20 drop-shadow-sm group-hover:scale-110 transition-transform duration-300`}
                    strokeWidth={0.5}
                />
                {count !== undefined && (
                    <div className="absolute -top-1 -right-1 bg-white border border-slate-100 shadow-sm rounded-full w-8 h-8 flex items-center justify-center text-xs font-bold text-slate-700">
                        {count}
                    </div>
                )}
            </div>

            <span className="font-bold text-slate-700 text-center text-lg group-hover:text-indigo-600 transition-colors">
                {label}
            </span>

            {subLabel && (
                <div className="mt-2 text-xs font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded-md">
                    {subLabel}
                </div>
            )}
        </div>
    );
};
