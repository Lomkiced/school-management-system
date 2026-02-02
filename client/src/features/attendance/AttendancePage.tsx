// FILE: client/src/features/attendance/AttendancePage.tsx
import { CalendarCheck, QrCode } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

export const AttendancePage = () => {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Attendance Management</h1>

            <div className="grid gap-6 md:grid-cols-2">
                {/* QR Code Section */}
                <Card className="hover:shadow-lg transition-shadow cursor-pointer border-indigo-200">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-indigo-700">
                            <QrCode className="h-6 w-6" />
                            QR Check-in
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-slate-600 mb-4">
                            Generate a QR code for students to scan and mark their attendance automatically.
                        </p>
                        <div className="bg-slate-100 h-48 rounded-lg flex items-center justify-center border-2 border-dashed border-slate-300">
                            <span className="text-slate-400 text-sm">QR Code Generator Loading...</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Manual Method */}
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CalendarCheck className="h-6 w-6" />
                            View Records
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-slate-600 mb-4">
                            View reports and manually edit attendance records for students.
                        </p>
                        <div className="space-y-2">
                            <div className="h-10 bg-slate-50 rounded w-full" />
                            <div className="h-10 bg-slate-50 rounded w-full" />
                            <div className="h-10 bg-slate-50 rounded w-full" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card>
                    <CardHeader><CardTitle className="text-lg">Today's Presence</CardTitle></CardHeader>
                    <CardContent><div className="text-3xl font-bold text-emerald-600">92%</div></CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle className="text-lg">Late Arrivals</CardTitle></CardHeader>
                    <CardContent><div className="text-3xl font-bold text-amber-500">12</div></CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle className="text-lg">Absent</CardTitle></CardHeader>
                    <CardContent><div className="text-3xl font-bold text-red-500">5</div></CardContent>
                </Card>
            </div>
        </div>
    );
};

export default AttendancePage;
