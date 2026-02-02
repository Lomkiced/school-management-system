// FILE: client/src/components/people/IDCardTemplate.tsx
import { forwardRef } from 'react';
import { cn } from '../../lib/utils';

interface IDCardProps {
    user: {
        id: string;
        firstName: string;
        lastName: string;
        role: string;
        photo?: string;
        department?: string; // For faculty
        gradeLevel?: number; // For student
        section?: string;    // For student
        idNumber: string;    // The visible ID
    };
    variant?: 'student' | 'faculty';
}

export const IDCardTemplate = forwardRef<HTMLDivElement, IDCardProps>(({ user, variant = 'student' }, ref) => {
    const isStudent = variant === 'student';
    const primaryColor = isStudent ? 'bg-indigo-600' : 'bg-emerald-600';
    const secondaryColor = isStudent ? 'bg-indigo-800' : 'bg-emerald-800';

    return (
        <div ref={ref} className="w-[350px] h-[550px] bg-white rounded-xl overflow-hidden shadow-2xl relative print:shadow-none print:w-[350px] print:h-[550px] print:m-0">
            {/* Header Background */}
            <div className={cn("h-40 relative clip-path-slant", primaryColor)}>
                <div className={cn("absolute inset-0 opacity-20 bg-[url('/pattern.png')]")} />
                <div className="absolute top-6 left-1/2 -translate-x-1/2 text-center text-white">
                    <div className="font-bold text-lg tracking-wider">HARVARD UNIVERSITY</div>
                    <div className="text-[10px] opacity-80 uppercase tracking-widest">School Management System</div>
                </div>
            </div>

            {/* Photo Area */}
            <div className="absolute top-24 left-1/2 -translate-x-1/2">
                <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-slate-200">
                    {user.photo ? (
                        <img src={user.photo} alt="ID Photo" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-slate-400">
                            {user.firstName[0]}
                        </div>
                    )}
                </div>
            </div>

            {/* Details */}
            <div className="mt-20 text-center px-6">
                <h2 className="text-2xl font-bold text-slate-800 uppercase leading-none mb-1">
                    {user.firstName} {user.lastName}
                </h2>
                <div className={cn("inline-block px-3 py-1 rounded-full text-xs font-bold text-white uppercase mb-6", secondaryColor)}>
                    {isStudent ? 'Student' : 'Faculty'}
                </div>

                <div className="space-y-3 text-sm">
                    {isStudent ? (
                        <>
                            <div className="flex justify-between border-b border-slate-100 pb-1">
                                <span className="text-slate-500 font-medium">Grade Level</span>
                                <span className="font-bold text-slate-800">{user.gradeLevel}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-100 pb-1">
                                <span className="text-slate-500 font-medium">Section</span>
                                <span className="font-bold text-slate-800">{user.section || 'N/A'}</span>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="flex justify-between border-b border-slate-100 pb-1">
                                <span className="text-slate-500 font-medium">Department</span>
                                <span className="font-bold text-slate-800">{user.department || 'General'}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-100 pb-1">
                                <span className="text-slate-500 font-medium">Role</span>
                                <span className="font-bold text-slate-800">Instructor</span>
                            </div>
                        </>
                    )}
                    <div className="flex justify-between border-b border-slate-100 pb-1">
                        <span className="text-slate-500 font-medium">ID Number</span>
                        <span className="font-bold text-slate-800">{user.idNumber}</span>
                    </div>
                </div>
            </div>

            {/* Barcode Footer */}
            <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center">
                {/* Dynamic Barcode via Standard API */}
                <img
                    src={`https://bwipjs-api.metafloor.org/?bcid=code128&text=${user.idNumber}&scale=3&height=10&incltext=false`}
                    alt="Barcode"
                    className="h-12 w-48 object-contain opacity-80"
                />
                <p className="text-[10px] text-slate-400 mt-2 font-mono">{user.id}</p>
            </div>

            {/* Accent Line */}
            <div className={cn("absolute bottom-0 left-0 right-0 h-2", secondaryColor)} />
        </div>
    );
});

IDCardTemplate.displayName = 'IDCardTemplate';
