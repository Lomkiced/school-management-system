// FILE: client/src/features/schedule/TimetablePage.tsx
import { CalendarRange, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

export const TimetablePage = () => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const periods = ['08:00 - 09:00', '09:00 - 10:00', '10:00 - 10:30 (Recess)', '10:30 - 11:30', '11:30 - 12:30'];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Class Timetable</h1>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">Download PDF</button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CalendarRange className="h-5 w-5" />
                        Weekly Schedule
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-700 font-bold uppercase">
                                <tr>
                                    <th className="px-4 py-3 border-b">Time / Day</th>
                                    {days.map(day => <th key={day} className="px-4 py-3 border-b">{day}</th>)}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {periods.map((period, index) => (
                                    <tr key={index} className="hover:bg-slate-50/50">
                                        <td className="px-4 py-3 font-medium text-slate-900 flex items-center gap-2">
                                            <Clock size={14} className="text-slate-400" />
                                            {period}
                                        </td>
                                        {days.map(day => (
                                            <td key={day} className="px-4 py-3 text-slate-500">
                                                {period.includes('Recess') ? (
                                                    <span className="inline-block px-2 py-1 bg-slate-200 text-slate-600 rounded text-xs font-bold">BREAK</span>
                                                ) : (
                                                    // Randomly generating empty or subject for demo
                                                    Math.random() > 0.3 ? (
                                                        <div className="p-2 bg-indigo-50 border border-indigo-100 rounded text-center">
                                                            <div className="font-bold text-indigo-700">Math</div>
                                                            <div className="text-xs">Room 101</div>
                                                        </div>
                                                    ) : <span className="text-slate-300">-</span>
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default TimetablePage;
