import { forwardRef } from 'react';
import QRCode from 'react-qr-code';
import { Shield, Scissors } from 'lucide-react';

interface CredentialSlipProps {
    studentName: string;
    email: string;
    password?: string;
    schoolName?: string;
    role?: 'Student' | 'Parent';
    details?: string; // e.g. "Grade 1 - Rizal" or "Linked to: John Doe"
}

export const CredentialSlip = forwardRef<HTMLDivElement, CredentialSlipProps>(({
    studentName,
    email,
    password,
    schoolName = 'School Management',
    role = 'Student',
    details = 'General Access'
}, ref) => {
    const isParent = role === 'Parent';
    const accentColor = isParent ? 'bg-emerald-600' : 'bg-slate-900';
    const accentText = isParent ? 'text-emerald-700' : 'text-slate-900';
    const badgeText = isParent ? 'PARENT ACCESS' : 'STUDENT ACCESS';

    return (
        <div ref={ref} className="w-[800px] mx-auto bg-white p-6 font-sans text-slate-900 print:w-full print:mx-0">

            {/* Main Container with Dashed Cut Line */}
            <div className="relative border-2 border-dashed border-slate-300 rounded-3xl p-8 bg-white">

                {/* Scissors Icon for visual cue */}
                <div className="absolute -top-3 left-8 bg-white px-2 text-slate-400 flex items-center gap-1">
                    <Scissors size={14} className="transform -rotate-90" />
                    <span className="text-[10px] uppercase tracking-widest font-bold">Cut Here</span>
                </div>

                {/* Header Section */}
                <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg ${accentColor} flex items-center justify-center text-white font-bold text-xl`}>
                            {schoolName.charAt(0)}
                        </div>
                        <div>
                            <h1 className="text-lg font-bold leading-none">{schoolName}</h1>
                            <p className="text-xs text-slate-500 uppercase tracking-widest mt-1">Access Portal</p>
                        </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full ${accentColor} text-white text-[10px] font-bold uppercase tracking-widest shadow-sm`}>
                        {badgeText}
                    </div>
                </div>

                {/* Name Section */}
                <div className="mb-8">
                    <h2 className="text-3xl font-bold tracking-tight mb-1">{studentName}</h2>
                </div>

                {/* Credentials Card */}
                <div className="flex bg-slate-50 rounded-2xl p-6 border border-slate-100 relative overflow-hidden">

                    {/* Left: Info */}
                    <div className="flex-1 space-y-5 relative z-10">
                        <div>
                            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Username / Email</p>
                            <p className="font-mono text-lg font-bold text-slate-900">{email}</p>
                        </div>

                        <div>
                            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">{password ? 'Initial Password' : 'Account Status'}</p>
                            {password ? (
                                <p className="font-mono text-xl font-bold text-slate-900 tracking-wider">{password}</p>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="font-bold text-slate-700">Active Password</span>
                                </div>
                            )}
                        </div>

                        <div>
                            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">Details</p>
                            <p className="text-sm font-medium text-slate-600">{details}</p>
                        </div>
                    </div>

                    {/* Right: QR Code */}
                    <div className="flex flex-col items-center justify-center pl-6 border-l border-slate-200">
                        <div className="bg-white p-2 rounded-lg shadow-sm border border-slate-100">
                            <QRCode
                                value={JSON.stringify({ email, role, portal: 'http://localhost:5173' })}
                                size={100}
                                level="M"
                            />
                        </div>
                        <p className="text-[9px] text-slate-400 mt-2 font-mono uppercase tracking-wide">Scan to Login</p>
                    </div>
                </div>

                {/* Footer Security Alert */}
                <div className="mt-6 flex items-center gap-2 text-rose-600">
                    <Shield size={14} />
                    <p className="text-[10px] font-bold uppercase tracking-wide">
                        Security Alert: Change your password immediately after first login.
                    </p>
                </div>
            </div>

            {/* Header / Meta outside the box (optional, usually top of page but user wants slip loop) */}
            {/* We will let the parent component handle multiple slips */}
        </div>
    );
});

CredentialSlip.displayName = 'CredentialSlip';
