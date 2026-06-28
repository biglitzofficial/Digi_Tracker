import { useEffect, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import {
  Building2, TrendingUp, ArrowLeft, ChevronDown, ChevronUp, Users, Flame, Trophy,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { adminAnalyticsAPI } from '../services/api';
import EmptyState from '../components/EmptyState';

const COLORS = ['#6366F1', '#8B5CF6', '#10B981', '#F59E0B', '#EC4899', '#3B82F6'];

const PERF_STYLE = {
  high: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  average: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  low: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  no_data: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

const PERF_LABEL = {
  high: 'High',
  average: 'Avg',
  low: 'Low',
  no_data: 'No data',
};

function formatValue(val, type) {
  if (val == null) return '—';
  if (type === 'currency') return `$${Number(val).toLocaleString()}`;
  if (type === 'percentage') return `${val}%`;
  return Number(val).toLocaleString();
}

function BusinessDetail({ business }) {
  return (
    <div className="px-6 pb-6 pt-2 space-y-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30">
      <div>
        <h4 className="font-semibold text-sm mb-3">Channel & field growth (business totals)</h4>
        <div className="space-y-4">
          {business.modules?.map((mod) => (
            <div key={mod.moduleId} className="card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <p className="font-medium">{mod.name}</p>
                <div className="flex gap-3 text-sm">
                  <span className={mod.growth >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {mod.growth}% growth
                  </span>
                  <span className="text-gray-500">{mod.entries} entries</span>
                  <span className="text-gray-500">{mod.submissionRate}% submitted</span>
                </div>
              </div>
              {mod.fields?.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-left text-gray-500 border-b border-gray-200 dark:border-gray-700">
                        <th className="pb-2 pr-4">Field</th>
                        <th className="pb-2 pr-4">Opening</th>
                        <th className="pb-2 pr-4">Latest</th>
                        <th className="pb-2 pr-4">Net change</th>
                        <th className="pb-2">Growth</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mod.fields.map((f) => (
                        <tr key={f.slug} className="border-b border-gray-100 dark:border-gray-800">
                          <td className="py-2 pr-4 font-medium">{f.name}</td>
                          <td className="py-2 pr-4 text-gray-500">{formatValue(f.openingBalance, f.type)}</td>
                          <td className="py-2 pr-4">{formatValue(f.latestValue, f.type)}</td>
                          <td className="py-2 pr-4">{f.netChange != null ? formatValue(f.netChange, f.type) : '—'}</td>
                          <td className={`py-2 ${f.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {f.growth}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-gray-500">No numeric fields</p>
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
          <Users className="w-4 h-4" /> Staff performance
        </h4>
        {!business.staff?.length ? (
          <p className="text-sm text-gray-500">No active staff for this business</p>
        ) : (
          <div className="space-y-4">
            {business.staff.map((s) => (
              <div key={s.userId} className="card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                  <div>
                    <p className="font-semibold">{s.name}</p>
                    <p className="text-xs text-gray-500">{s.email}</p>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <span className="flex items-center gap-1">
                      <Trophy className="w-4 h-4 text-yellow-500" /> {s.points} pts
                    </span>
                    <span className="flex items-center gap-1">
                      <Flame className="w-4 h-4 text-orange-500" /> {s.streak} streak
                    </span>
                    <span className="font-medium text-primary-600">Score: {s.overallScore}</span>
                  </div>
                </div>

                {(s.strengths?.length > 0 || s.weaknesses?.length > 0) && (
                  <div className="flex flex-wrap gap-2 mb-4 text-xs">
                    {s.strengths?.map((name) => (
                      <span key={name} className="px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                        ↑ {name}
                      </span>
                    ))}
                    {s.weaknesses?.map((name) => (
                      <span key={name} className="px-2 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300">
                        ↓ {name}
                      </span>
                    ))}
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full text-xs min-w-[640px]">
                    <thead>
                      <tr className="text-left text-gray-500 border-b border-gray-200 dark:border-gray-700">
                        <th className="pb-2 pr-3">Module</th>
                        <th className="pb-2 pr-3">Status</th>
                        <th className="pb-2 pr-3">Growth</th>
                        <th className="pb-2 pr-3">Completion</th>
                        <th className="pb-2">Field results</th>
                      </tr>
                    </thead>
                    <tbody>
                      {s.modules?.map((m) => (
                        <tr key={m.moduleId} className="border-b border-gray-100 dark:border-gray-800 align-top">
                          <td className="py-2 pr-3 font-medium whitespace-nowrap">{m.moduleName}</td>
                          <td className="py-2 pr-3">
                            <span className={`px-2 py-0.5 rounded-full font-medium ${PERF_STYLE[m.performance]}`}>
                              {PERF_LABEL[m.performance]}
                            </span>
                          </td>
                          <td className={`py-2 pr-3 ${m.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {m.performance === 'no_data' ? '—' : `${m.growth}%`}
                          </td>
                          <td className="py-2 pr-3">{m.completionRate}%</td>
                          <td className="py-2">
                            {m.fields?.length ? (
                              <div className="flex flex-wrap gap-1">
                                {m.fields.map((f) => (
                                  <span
                                    key={f.slug}
                                    className="inline-block px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                                    title={`${f.name}: ${f.growth}% growth`}
                                  >
                                    {f.name}: {formatValue(f.latestValue, f.type)}
                                    {f.growth !== 0 && (
                                      <span className={f.growth >= 0 ? ' text-green-600' : ' text-red-600'}>
                                        {' '}({f.growth > 0 ? '+' : ''}{f.growth}%)
                                      </span>
                                    )}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              '—'
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {s.recommendations?.length > 0 && (
                  <ul className="mt-3 text-xs text-gray-500 list-disc list-inside space-y-0.5">
                    {s.recommendations.map((tip, i) => (
                      <li key={i}>{tip}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SuperAdminBusinessAnalytics() {
  const { user, loading: authLoading } = useAuth();
  const [period, setPeriod] = useState('monthly');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    setLoading(true);
    adminAnalyticsAPI.businessComparison({ period })
      .then((res) => setData(res.data.data))
      .catch(() => toast.error('Failed to load business comparison'))
      .finally(() => setLoading(false));
  }, [period]);

  if (authLoading) return <div className="py-12 text-center text-gray-500">Loading...</div>;
  if (user?.role !== 'super_admin') return <Navigate to="/" replace />;

  const chartData = (data?.businesses || []).map((b) => ({
    name: b.name.length > 14 ? `${b.name.slice(0, 12)}…` : b.name,
    fullName: b.name,
    growth: b.avgGrowth,
    entries: b.periodEntries,
  }));

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-6">
      <div>
        <Link to="/super-admin" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2">
          <ArrowLeft className="w-4 h-4" /> Super Admin
        </Link>
        <h1 className="text-2xl font-bold">Business Comparison</h1>
        <p className="text-gray-500">
          Compare businesses, channel growth, field results, and staff performance
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <select className="input w-auto" value={period} onChange={(e) => setPeriod(e.target.value)}>
          <option value="weekly">This Week</option>
          <option value="monthly">This Month</option>
          <option value="quarterly">This Quarter</option>
          <option value="yearly">This Year</option>
        </select>
      </div>

      {data?.summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card p-5">
            <p className="text-sm text-gray-500">Total Businesses</p>
            <p className="text-3xl font-bold mt-1">{data.summary.totalBusinesses}</p>
          </div>
          <div className="card p-5">
            <p className="text-sm text-gray-500">Entries This Period</p>
            <p className="text-3xl font-bold mt-1">{data.summary.totalEntries}</p>
          </div>
          <div className="card p-5">
            <p className="text-sm text-gray-500 flex items-center gap-1">
              <TrendingUp className="w-4 h-4 text-green-500" /> Top Performer
            </p>
            <p className="text-lg font-bold mt-1">{data.summary.topBusiness?.name || '—'}</p>
            <p className="text-sm text-gray-500">{data.summary.topBusiness?.avgGrowth ?? 0}% avg growth</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="card p-12 text-center text-gray-500">Loading...</div>
      ) : !data?.businesses?.length ? (
        <EmptyState icon={Building2} title="No businesses" subtitle="Add businesses from Super Admin to compare them here" />
      ) : (
        <>
          <div className="card p-6">
            <h3 className="font-semibold mb-4">Average Growth by Business</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} unit="%" />
                <Tooltip
                  formatter={(v) => [`${v}%`, 'Avg Growth']}
                  labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName || ''}
                />
                <Bar dataKey="growth" radius={[6, 6, 0, 0]}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
              <h3 className="font-semibold">Business breakdown</h3>
              <p className="text-sm text-gray-500">Click a row to see field growth and staff results</p>
            </div>
            {data.businesses.map((b) => (
              <div key={b.businessId} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                <button
                  type="button"
                  className="w-full px-6 py-4 flex flex-wrap items-center gap-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  onClick={() => toggleExpand(b.businessId)}
                >
                  <div className="flex-1 min-w-[160px]">
                    <p className="font-medium">{b.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{b.type?.replace('_', ' ')}</p>
                  </div>
                  <div className="flex flex-wrap gap-6 text-sm">
                    <span className="text-gray-500">
                      <Users className="w-3.5 h-3.5 inline mr-1" />
                      {b.staff?.[0]?.name || (b.staffCount ? `${b.staffCount} staff` : 'No staff')}
                    </span>
                    <span>{b.periodEntries} entries</span>
                    <span className={b.avgGrowth >= 0 ? 'text-green-600' : 'text-red-600'}>{b.avgGrowth}% growth</span>
                    <span className="text-green-700 dark:text-green-400 hidden sm:inline">
                      Best: {b.bestModule?.name || '—'}
                    </span>
                    <span className="text-amber-700 dark:text-amber-400 hidden sm:inline">
                      Weak: {b.worstModule?.entries > 0 ? b.worstModule.name : '—'}
                    </span>
                  </div>
                  {expandedId === b.businessId ? (
                    <ChevronUp className="w-5 h-5 text-gray-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />
                  )}
                </button>
                {expandedId === b.businessId && <BusinessDetail business={b} />}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
