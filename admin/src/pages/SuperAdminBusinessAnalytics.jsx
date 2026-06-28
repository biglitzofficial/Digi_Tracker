import { useEffect, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { Building2, TrendingUp, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { adminAnalyticsAPI } from '../services/api';
import EmptyState from '../components/EmptyState';

const COLORS = ['#6366F1', '#8B5CF6', '#10B981', '#F59E0B', '#EC4899', '#3B82F6'];

export default function SuperAdminBusinessAnalytics() {
  const { user, loading: authLoading } = useAuth();
  const [period, setPeriod] = useState('monthly');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="space-y-6">
      <div>
        <Link to="/super-admin" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2">
          <ArrowLeft className="w-4 h-4" /> Super Admin
        </Link>
        <h1 className="text-2xl font-bold">Business Comparison</h1>
        <p className="text-gray-500">Compare growth and activity across all businesses</p>
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
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr className="text-left text-gray-500">
                  <th className="px-6 py-3">Business</th>
                  <th className="px-6 py-3">Staff</th>
                  <th className="px-6 py-3">Entries</th>
                  <th className="px-6 py-3">Avg Growth</th>
                  <th className="px-6 py-3">Submission Rate</th>
                  <th className="px-6 py-3">Best Channel</th>
                  <th className="px-6 py-3">Needs Attention</th>
                </tr>
              </thead>
              <tbody>
                {data.businesses.map((b) => (
                  <tr key={b.businessId} className="border-t border-gray-100 dark:border-gray-800">
                    <td className="px-6 py-4">
                      <p className="font-medium">{b.name}</p>
                      <p className="text-xs text-gray-500 capitalize">{b.type?.replace('_', ' ')}</p>
                    </td>
                    <td className="px-6 py-4">{b.staffCount}</td>
                    <td className="px-6 py-4">{b.periodEntries}</td>
                    <td className="px-6 py-4">
                      <span className={b.avgGrowth >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {b.avgGrowth}%
                      </span>
                    </td>
                    <td className="px-6 py-4">{b.submissionRate}%</td>
                    <td className="px-6 py-4 text-green-700 dark:text-green-400">
                      {b.bestModule ? `${b.bestModule.name} (${b.bestModule.growth}%)` : '—'}
                    </td>
                    <td className="px-6 py-4 text-amber-700 dark:text-amber-400">
                      {b.worstModule && b.worstModule.entries > 0
                        ? `${b.worstModule.name} (${b.worstModule.growth}%)`
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
