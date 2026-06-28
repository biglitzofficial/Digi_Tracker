import { useEffect, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { ArrowLeft, Users, Flame, Trophy, AlertCircle, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { adminAnalyticsAPI, businessAPI } from '../services/api';
import { getActiveBusinessId } from '../components/BusinessSwitcher';
import EmptyState from '../components/EmptyState';

const PERF_STYLE = {
  high: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  average: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  low: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  no_data: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

const PERF_LABEL = {
  high: 'High',
  average: 'Average',
  low: 'Low',
  no_data: 'No data',
};

export default function SuperAdminStaffPerformance() {
  const { user, loading: authLoading } = useAuth();
  const [businesses, setBusinesses] = useState([]);
  const [businessId, setBusinessId] = useState(getActiveBusinessId() || '');
  const [period, setPeriod] = useState('monthly');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    businessAPI.list().then((res) => {
      const list = res.data.data || [];
      setBusinesses(list);
      if (!businessId && list.length) setBusinessId(list[0]._id);
    });
  }, []);

  useEffect(() => {
    if (!businessId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    adminAnalyticsAPI.staffPerformance({ businessId, period })
      .then((res) => setReport(res.data.data))
      .catch(() => toast.error('Failed to load staff performance'))
      .finally(() => setLoading(false));
  }, [businessId, period]);

  if (authLoading) return <div className="py-12 text-center text-gray-500">Loading...</div>;
  if (user?.role !== 'super_admin') return <Navigate to="/" replace />;

  const modules = report?.staff?.[0]?.modules || [];

  return (
    <div className="space-y-6">
      <div>
        <Link to="/super-admin" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2">
          <ArrowLeft className="w-4 h-4" /> Super Admin
        </Link>
        <h1 className="text-2xl font-bold">Staff Performance Report</h1>
        <p className="text-gray-500">See which staff excel or need coaching by channel</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <select className="input w-auto min-w-[200px]" value={businessId} onChange={(e) => setBusinessId(e.target.value)}>
          {businesses.map((b) => (
            <option key={b._id} value={b._id}>{b.name}</option>
          ))}
        </select>
        <select className="input w-auto" value={period} onChange={(e) => setPeriod(e.target.value)}>
          <option value="weekly">This Week</option>
          <option value="monthly">This Month</option>
          <option value="quarterly">This Quarter</option>
          <option value="yearly">This Year</option>
        </select>
      </div>

      {loading ? (
        <div className="card p-12 text-center text-gray-500">Loading report...</div>
      ) : !report?.staff?.length ? (
        <EmptyState
          icon={Users}
          title="No staff found"
          subtitle="Add staff to this business to see performance reports"
        />
      ) : (
        <>
          <div className="card overflow-x-auto">
            <table className="w-full text-sm min-w-[720px]">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr className="text-left text-gray-500">
                  <th className="px-4 py-3 sticky left-0 bg-gray-50 dark:bg-gray-800/50">Staff</th>
                  <th className="px-4 py-3">Score</th>
                  <th className="px-4 py-3">Points</th>
                  <th className="px-4 py-3">Streak</th>
                  {modules.map((m) => (
                    <th key={m.moduleId} className="px-4 py-3 whitespace-nowrap">{m.moduleName}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {report.staff.map((s, rank) => (
                  <tr key={s.userId} className="border-t border-gray-100 dark:border-gray-800">
                    <td className="px-4 py-3 sticky left-0 bg-white dark:bg-gray-900">
                      <p className="font-medium">{s.name}</p>
                      <p className="text-xs text-gray-500">#{rank + 1} · {s.avgCompletion}% completion</p>
                    </td>
                    <td className="px-4 py-3 font-bold text-primary-600">{s.overallScore}</td>
                    <td className="px-4 py-3">{s.points}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5 text-orange-500" /> {s.streak}
                      </span>
                    </td>
                    {s.modules.map((m) => (
                      <td key={m.moduleId} className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${PERF_STYLE[m.performance]}`}>
                          {PERF_LABEL[m.performance]}
                        </span>
                        {m.performance !== 'no_data' && (
                          <p className="text-xs text-gray-500 mt-0.5">{m.growth}% · {m.entries} entries</p>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {report.staff.map((s) => (
              <div key={s.userId} className="card p-6">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{s.name}</h3>
                    <p className="text-sm text-gray-500">{s.email}</p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="flex items-center gap-1 justify-end">
                      <Trophy className="w-4 h-4 text-yellow-500" /> {s.points} pts
                    </p>
                    <p className="text-gray-500">Score: {s.overallScore}</p>
                  </div>
                </div>

                {s.strengths.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-medium text-green-700 dark:text-green-400 flex items-center gap-1 mb-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Strengths
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {s.strengths.map((name) => (
                        <span key={name} className="text-xs px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {s.weaknesses.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-medium text-red-700 dark:text-red-400 flex items-center gap-1 mb-1">
                      <AlertCircle className="w-3.5 h-3.5" /> Needs improvement
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {s.weaknesses.map((name) => (
                        <span key={name} className="text-xs px-2 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300">
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs font-medium text-gray-500 mb-2">Coaching tips</p>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-disc list-inside">
                    {s.recommendations.map((tip, i) => (
                      <li key={i}>{tip}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
