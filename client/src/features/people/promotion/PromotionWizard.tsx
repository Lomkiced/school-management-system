// FILE: client/src/features/people/promotion/PromotionWizard.tsx
import { ArrowRight, CheckCheck, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import api from '../../../lib/axios';

export const PromotionWizard = () => {
    const [step, setStep] = useState(1);
    const [classes, setClasses] = useState<any[]>([]);
    const [selectedClassId, setSelectedClassId] = useState('');
    const [candidates, setCandidates] = useState<any[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [promoteAll, setPromoteAll] = useState(true);

    // Initial Load
    useEffect(() => {
        fetchClasses();
    }, []);

    const fetchClasses = async () => {
        try {
            const res = await api.get('/classes');
            setClasses(res.data.data);
        } catch (e) {
            toast.error('Failed to load classes');
        }
    };

    const handleClassSelect = async () => {
        if (!selectedClassId) return;
        setIsProcessing(true);
        try {
            const res = await api.get(`/promotion/candidates/${selectedClassId}`);
            setCandidates(res.data.data);
            setStep(2);
        } catch (e) {
            toast.error('Failed to load promotion candidates');
        } finally {
            setIsProcessing(false);
        }
    };

    const executePromotion = async () => {
        setIsProcessing(true);
        try {
            // In a real app, filtering selected candidates if not 'All'
            const payload = candidates.filter(c => promoteAll);
            await api.post('/promotion/process', { candidates: payload });
            toast.success('Promotion completed successfully!');
            setStep(3);
        } catch (e) {
            toast.error('Promotion failed');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold text-slate-900">Annual Promotion Wizard</h1>
                <p className="text-slate-500">Automated student promotion management system</p>

                {/* Steps */}
                <div className="flex justify-center items-center gap-4 mt-6">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 1 ? 'bg-indigo-600 text-white' : 'bg-slate-200'}`}>1</div>
                    <div className="w-16 h-1 bg-slate-200" />
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 2 ? 'bg-indigo-600 text-white' : 'bg-slate-200'}`}>2</div>
                    <div className="w-16 h-1 bg-slate-200" />
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 3 ? 'bg-indigo-600 text-white' : 'bg-slate-200'}`}>3</div>
                </div>
            </div>

            {/* Step 1: Select Class */}
            {step === 1 && (
                <Card className="animate-in fade-in slide-in-from-bottom-4">
                    <CardHeader><CardTitle>Step 1: Select Source Class</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <select
                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            value={selectedClassId}
                            onChange={(e) => setSelectedClassId(e.target.value)}
                        >
                            <option value="">-- Select a Class --</option>
                            {classes.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                        <button
                            disabled={!selectedClassId || isProcessing}
                            onClick={handleClassSelect}
                            className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 flex justify-center items-center gap-2"
                        >
                            {isProcessing ? <Loader2 className="animate-spin" /> : <>Next <ArrowRight size={18} /></>}
                        </button>
                    </CardContent>
                </Card>
            )}

            {/* Step 2: Review Candidates */}
            {step === 2 && (
                <Card className="animate-in fade-in slide-in-from-bottom-4">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Step 2: Review Candidates</CardTitle>
                        <div className="flex items-center gap-2">
                            <input type="checkbox" checked={promoteAll} onChange={(e) => setPromoteAll(e.target.checked)} className="w-4 h-4" />
                            <span className="text-sm font-medium">Select All</span>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="max-h-96 overflow-y-auto border rounded-lg">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 sticky top-0">
                                    <tr>
                                        <th className="px-4 py-2">Student</th>
                                        <th className="px-4 py-2">Current GPA</th>
                                        <th className="px-4 py-2">Rec. Action</th>
                                        <th className="px-4 py-2">Next Grade</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {candidates.map(c => (
                                        <tr key={c.studentId} className={c.suggestedStatus === 'RETAINED' ? 'bg-red-50' : ''}>
                                            <td className="px-4 py-2 font-medium">{c.name}</td>
                                            <td className="px-4 py-2">{c.currentGpa.toFixed(2)}</td>
                                            <td className="px-4 py-2">
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${c.suggestedStatus === 'PROMOTED' ? 'bg-emerald-100 text-emerald-700' :
                                                    c.suggestedStatus === 'GRADUATED' ? 'bg-blue-100 text-blue-700' :
                                                        'bg-red-100 text-red-700'
                                                    }`}>
                                                    {c.suggestedStatus}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2 font-bold">{c.suggestedNextGrade}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="pt-4 flex gap-4">
                            <button onClick={() => setStep(1)} className="flex-1 py-3 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50">Back</button>
                            <button
                                onClick={executePromotion}
                                disabled={isProcessing}
                                className="flex-2 w-full py-3 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 disabled:opacity-50 flex justify-center items-center gap-2"
                            >
                                {isProcessing ? <Loader2 className="animate-spin" /> : <><CheckCheck size={18} /> Confirm Promotion</>}
                            </button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Step 3: Success */}
            {step === 3 && (
                <Card className="animate-in zoom-in-95 text-center py-10">
                    <CardContent>
                        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCheck className="w-10 h-10 text-emerald-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Promotion Complete!</h2>
                        <p className="text-slate-500 mb-8">All selected students have been processed successfully.</p>
                        <button
                            onClick={() => { setStep(1); setSelectedClassId(''); }}
                            className="px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800"
                        >
                            Process Another Class
                        </button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};
