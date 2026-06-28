import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, History, Filter, Pencil } from 'lucide-react';
import toast from 'react-hot-toast';
import { entryAPI, auditLogAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { isStaff } from '../utils/permissions';
import EmptyState from '../components/EmptyState';

function isToday(dateStr) {
  const d = new Date(dateStr);
  const today = new Date();
  return d.toDateString() === today.toDateString();
}

export default function Entries() {
  const { user } = useAuth();
  const staffView = isStaff(user);
  const [entries, setEntries] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('entries');
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ startDate: '', endDate: '' });

  const load = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      if (tab === 'entries') {
        const { data } = staffView
          ? await entryAPI.myHistory(params)
          : await entryAPI.list(params);
        setEntries(data.data);
      } else {
        const { data } = await auditLogAPI.list(params);
        setAuditLogs(data.data);
      }
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [tab, page, filters, staffView]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{staffView ? 'My Entries' : 'Entries & Audit'}</h1>
        <p className="text-gray-500">
          {staffView ? 'Your submission history' : 'View submissions and change history'}
        </p>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        {!staffView && (
          <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <button
              className={`px-4 py-2 text-sm font-medium ${tab === 'entries' ? 'bg-primary-600 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
              onClick={() => { setTab('entries'); setPage(1); }}
            >
              <ClipboardList className="w-4 h-4 inline mr-1" /> Entries
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium ${tab === 'audit' ? 'bg-primary-600 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
              onClick={() => { setTab('audit'); setPage(1); }}
            >
              <History className="w-4 h-4 inline mr-1" /> Audit Logs
            </button>
          </div>
        )}
        {!staffView && (
          <div className="flex items-center gap-2 ml-auto">
            <Filter className="w-4 h-4 text-gray-400" />
            <input type="date" className="input w-auto text-sm" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} />
            <span className="text-gray-400">—</span>
            <input type="date" className="input w-auto text-sm" value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} />
          </div>
        )}
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-gray-500">Loading...</div>
        ) : tab === 'entries' ? (
          entries.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="No entries found"
              subtitle={staffView ? 'Submit entries from the Today page to see them here' : 'Entries will appear here once staff submit data'}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800/50">
                  <tr className="text-left text-gray-500">
                    <th className="px-6 py-3">Module</th>
                    {!staffView && <th className="px-6 py-3">Submitted By</th>}
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Values</th>
                    <th className="px-6 py-3">Status</th>
                    {staffView && <th className="px-6 py-3">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e) => (
                    <tr key={e._id} className="border-t border-gray-100 dark:border-gray-800">
                      <td className="px-6 py-4 font-medium">{e.moduleId?.name || '—'}</td>
                      {!staffView && (
                        <td className="px-6 py-4 text-gray-500">
                          {e.userId?.firstName} {e.userId?.lastName}
                        </td>
                      )}
                      <td className="px-6 py-4">{new Date(e.entryDate).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-gray-500">{e.values?.length || 0} fields</td>
                      <td className="px-6 py-4">
                        {e.isEdited ? (
                          <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-700">Edited ({e.editCount})</span>
                        ) : (
                          <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">Original</span>
                        )}
                      </td>
                      {staffView && (
                        <td className="px-6 py-4">
                          {isToday(e.entryDate) && (
                            <Link
                              to={`/entries/${e._id}/edit`}
                              className="text-sm text-primary-600 hover:text-primary-700 font-medium inline-flex items-center gap-1"
                            >
                              <Pencil className="w-3.5 h-3.5" /> Edit
                            </Link>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : auditLogs.length === 0 ? (
          <EmptyState icon={History} title="No audit logs" subtitle="Changes to entries will be tracked here" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr className="text-left text-gray-500">
                  <th className="px-6 py-3">Action</th>
                  <th className="px-6 py-3">User</th>
                  <th className="px-6 py-3">Entry Date</th>
                  <th className="px-6 py-3">IP</th>
                  <th className="px-6 py-3">When</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log._id} className="border-t border-gray-100 dark:border-gray-800">
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${log.action === 'create' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4">{log.userId?.firstName} {log.userId?.lastName}</td>
                    <td className="px-6 py-4 text-gray-500">
                      {log.entryId?.entryDate ? new Date(log.entryId.entryDate).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-6 py-4 text-gray-500 font-mono text-xs">{log.ipAddress || '—'}</td>
                    <td className="px-6 py-4 text-gray-500">{new Date(log.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
