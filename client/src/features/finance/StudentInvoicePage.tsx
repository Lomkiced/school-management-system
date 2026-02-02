// FILE: client/src/features/finance/StudentInvoicePage.tsx
import { CreditCard, DollarSign, Download, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

export const StudentInvoicePage = () => {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">My Finances</h1>

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                    <CardHeader><CardTitle className="text-indigo-100">Total Due</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold">$1,250.00</div>
                        <p className="text-indigo-100 text-sm mt-2">Due by Jan 31, 2026</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Invoice History
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-slate-100 rounded-lg">
                                        <DollarSign className="text-slate-600" size={24} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900">Tuition Fee - January 2026</p>
                                        <p className="text-sm text-slate-500">Inv #{202600 + i} • Issued Jan 01</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">PENDING</span>
                                    <button className="p-2 text-slate-400 hover:text-indigo-600">
                                        <Download size={20} />
                                    </button>
                                    <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm hover:bg-slate-800">
                                        <CreditCard size={16} /> Pay
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default StudentInvoicePage;
