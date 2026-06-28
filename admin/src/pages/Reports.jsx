import { useEffect, useState } from 'react';
import { FileText, Download, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { reportAPI } from '../services/api';
import { parseApiError } from '../utils/apiError';

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [preview, setPreview] = useState(null);
  const [form, setForm] = useState({
    type: 'monthly',
    format: 'pdf',
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });

  const loadReports = () => {
    reportAPI.list().then((res) => setReports(res.data.data)).catch(console.error);
  };

  useEffect(() => { loadReports(); }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await reportAPI.generate({
        type: form.type,
        format: form.format,
        period: { start: form.start, end: form.end },
        includeCharts: true,
        includeLeaderboard: true,
      });
      toast.success('Report generated successfully');
      loadReports();
    } catch (err) {
      toast.error(parseApiError(err, 'Failed to generate report'));
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = (id) => {
    const token = localStorage.getItem('accessToken');
    window.open(`${import.meta.env.VITE_API_URL}/reports/${id}/download?token=${token}`, '_blank');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-gray-500">Generate and export business reports</p>
      </div>

      <div className="card p-6">
        <h3 className="font-semibold mb-4">Generate New Report</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-medium">Report Type</label>
            <select className="input mt-1" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom'].map((t) => (
                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Format</label>
            <select className="input mt-1" value={form.format} onChange={(e) => setForm({ ...form, format: e.target.value })}>
              <option value="pdf">PDF</option>
              <option value="excel">Excel</option>
              <option value="csv">CSV</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Start Date</label>
            <input type="date" className="input mt-1" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium">End Date</label>
            <input type="date" className="input mt-1" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} />
          </div>
        </div>
        <button className="btn-primary mt-4" onClick={handleGenerate} disabled={generating}>
          {generating ? 'Generating...' : 'Generate Report'}
        </button>
      </div>

      <div className="card p-6">
        <h3 className="font-semibold mb-4">Report History</h3>
        {reports.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-gray-300 mx-auto" />
            <p className="mt-2 text-gray-500">No reports generated yet</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-200 dark:border-gray-800">
                <th className="pb-3">Type</th>
                <th className="pb-3">Format</th>
                <th className="pb-3">Period</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Created</th>
                <th className="pb-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r._id} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-3 capitalize">{r.type}</td>
                  <td className="py-3 uppercase">{r.format}</td>
                  <td className="py-3 text-gray-500">
                    {new Date(r.period.start).toLocaleDateString()} — {new Date(r.period.end).toLocaleDateString()}
                  </td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${r.status === 'completed' ? 'bg-green-100 text-green-700' : r.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="py-3 text-gray-500">{new Date(r.createdAt).toLocaleDateString()}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      <button onClick={() => setPreview(r)} className="text-gray-500 hover:text-gray-700 flex items-center gap-1">
                        <Eye className="w-4 h-4" /> Preview
                      </button>
                      {r.status === 'completed' && (
                        <button onClick={() => handleDownload(r._id)} className="text-primary-600 hover:text-primary-700 flex items-center gap-1">
                          <Download className="w-4 h-4" /> Download
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {preview && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setPreview(null)}>
          <div className="card p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold mb-4">Report Preview</h3>
            <div className="space-y-2 text-sm">
              <p><span className="text-gray-500">Type:</span> <span className="capitalize font-medium">{preview.type}</span></p>
              <p><span className="text-gray-500">Format:</span> <span className="uppercase font-medium">{preview.format}</span></p>
              <p><span className="text-gray-500">Period:</span> {new Date(preview.period.start).toLocaleDateString()} — {new Date(preview.period.end).toLocaleDateString()}</p>
              <p><span className="text-gray-500">Status:</span> <span className="capitalize">{preview.status}</span></p>
              <p><span className="text-gray-500">Created:</span> {new Date(preview.createdAt).toLocaleString()}</p>
            </div>
            <div className="flex gap-3 mt-6">
              <button className="btn-secondary flex-1" onClick={() => setPreview(null)}>Close</button>
              {preview.status === 'completed' && (
                <button className="btn-primary flex-1" onClick={() => handleDownload(preview._id)}>Download</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
