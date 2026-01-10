import { FileSpreadsheet, Upload, X } from 'lucide-react';
import Papa from 'papaparse';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import api from '../../lib/axios';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export const ImportStudentsModal = ({ onClose, onSuccess }: Props) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  // 1. Handle File Selection & Parsing
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      // Parse CSV immediately to show preview
      Papa.parse(selectedFile, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setPreview(results.data);
        }
      });
    }
  };

  // 2. Send Data to Server
  const handleUpload = async () => {
    if (preview.length === 0) return;
    setUploading(true);
    
    try {
      // Validate Data Structure
      const cleanData = preview.map((row: any) => ({
        firstName: row.firstName || row['First Name'],
        lastName: row.lastName || row['Last Name'],
        email: row.email || row['Email'],
        gender: row.gender || row['Gender'] || 'MALE'
      })).filter(s => s.email && s.firstName); // Filter bad rows

      const res = await api.post('/students/bulk', { students: cleanData });
      
      toast.success("Import Successful", { description: res.data.message });
      onSuccess(); // Refresh the list
      onClose();   // Close modal
    } catch (error) {
      toast.error("Import Failed", { description: "Check your CSV format and try again." });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b flex justify-between items-center bg-slate-50">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <FileSpreadsheet className="text-green-600" /> Batch Student Import
            </h2>
            <p className="text-sm text-slate-500">Upload a CSV file to add students in bulk.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full"><X size={20} /></button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto">
          {!file ? (
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-12 flex flex-col items-center justify-center text-slate-500 hover:bg-slate-50 hover:border-blue-400 transition-colors cursor-pointer relative">
              <input type="file" accept=".csv" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
              <Upload size={48} className="mb-4 text-slate-300" />
              <p className="font-medium">Click to Upload or Drag CSV here</p>
              <p className="text-xs mt-2">Format: firstName, lastName, email, gender</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg border border-blue-100">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded"><FileSpreadsheet size={20} className="text-blue-600"/></div>
                    <div>
                        <p className="font-medium text-sm">{file.name}</p>
                        <p className="text-xs text-blue-600">{preview.length} students found</p>
                    </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => { setFile(null); setPreview([]); }}>Change</Button>
              </div>

              {/* Preview Table */}
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-100 text-slate-600">
                        <tr>
                            <th className="p-2">First Name</th>
                            <th className="p-2">Last Name</th>
                            <th className="p-2">Email</th>
                        </tr>
                    </thead>
                    <tbody>
                        {preview.slice(0, 5).map((row: any, i) => (
                            <tr key={i} className="border-t">
                                <td className="p-2">{row.firstName || row['First Name']}</td>
                                <td className="p-2">{row.lastName || row['Last Name']}</td>
                                <td className="p-2">{row.email || row['Email']}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {preview.length > 5 && <div className="p-2 text-center text-xs text-slate-500 bg-slate-50">...and {preview.length - 5} more</div>}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-slate-50 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleUpload} disabled={!file || uploading} className="bg-green-600 hover:bg-green-700">
            {uploading ? "Importing..." : "Confirm Import"}
          </Button>
        </div>
      </div>
    </div>
  );
};