import { forwardRef } from 'react';
import { CredentialSlip } from './CredentialSlip';
import { School } from 'lucide-react';

interface ClassCredentialSlipsProps {
    className: string;
    students: {
        name: string;
        email: string;
        password?: string;
    }[];
}

export const ClassCredentialSlips = forwardRef<HTMLDivElement, ClassCredentialSlipsProps>(({
    className,
    students
}, ref) => {
    return (
        <div ref={ref} className="bg-white print:w-full print:p-0">

            {/* Header Summary Page */}
            <div className="h-[200px] flex flex-col items-center justify-center text-center border-b-4 border-slate-900 border-dashed mb-8 print:hidden">
                <School size={60} className="mb-4 text-indigo-900" />
                <h1 className="text-3xl font-bold uppercase tracking-tight">Bulk Credential Export</h1>
                <p className="text-slate-500 mt-2">Ready to print {students.length} credentials for {className}</p>
            </div>

            <div className="max-w-[850px] mx-auto space-y-8 print:space-y-0 print:block">
                {students.map((s, i) => (
                    <div key={i} className="print:break-inside-avoid print:py-4">
                        <CredentialSlip
                            studentName={s.name}
                            email={s.email}
                            password={s.password}
                            role="Student"
                            details={className}
                            schoolName="DOST High School"
                        />
                        {/* Force page break every 2 items to ensure nice fit on A4/Letter */}
                        {(i + 1) % 2 === 0 && <div className="print:break-after-page hidden print:block" />}
                    </div>
                ))}
            </div>
        </div>
    );
});

ClassCredentialSlips.displayName = 'ClassCredentialSlips';
