import { useEffect, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { Building2, TrendingUp, ArrowLeft, TrendingDown, Minus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { adminAnalyticsAPI } from '../services/api';
import EmptyState from '../components/EmptyState';

const COLORS = ['#6366F1', '#8B5CF6', '#10B981', '#F59E0B', '#EC4899', '#3B82F6'];

const ICON_MAP = {
  instagram: '📸',
  whatsapp: '💬',
  'whatsapp-community': '💬',
  youtube: '📺',
  facebook: '📘',
  linkedin: '💼',
  google: '📍',
  'google-my-business': '📍',
};

function formatTickerValue(val, type) {
  if (val == null) return null;
  if (type === 'currency') return `$${Number(val).toLocaleString()}`;
  if (type === 'percentage') return `${val}%`;
  return Number(val).toLocaleString();
}

function MarketCell({ cell }) {
  if (!cell || cell.na) {
    return (
      <div className="market-cell market-cell-na">
        <span className="text-[10px] text-gray-400">N/A</span>
      </div>
    );
  }

  if (cell.signal === 'no_data') {
    return (
      <div className="market-cell market-cell-empty">
        <span className="text-[10px] font-semibold text-gray-500">—</span>
        <span className="text-[10px] text-gray-400">No entry</span>
      </div>
    );
  }

  const isHigh = cell.signal === 'high';
  const isLow = cell.signal === 'low';
  const cls = isHigh ? 'market-cell-high' : isLow ? 'market-cell-low' : 'market-cell-avg';
  const label = isHigh ? 'HIGH' : isLow ? 'LOW' : 'AVG';
  const TrendIcon = cell.trend === 'up' ? TrendingUp : cell.trend === 'down' ? TrendingDown : Minus;
  const value = formatTickerValue(cell.latestValue, cell.fieldType);

  return (
    <div className={`market-cell ${cls}`} title={cell.fieldName ? `${cell.fieldName}: ${value}` : undefined}>
      <div className="flex items-center justify-center gap-0.5">
        <TrendIcon className="w-3 h-3 shrink-0" />
        <span className="text-[10px] font-bold tracking-wide">{label}</span>
      </div>
      {value != null && <span className="font-mono text-xs font-semibold mt-0.5">{value}</span>}
      <span className={`text-[10px] mt-0.5 ${cell.growth >= 0 ? 'opacity-90' : 'opacity-90'}`}>
        {cell.growth > 0 ? '+' : ''}{cell.growth}%
      </span>
    </div>
  );
}

function OverallCell({ overall }) {
  if (!overall || overall.signal === 'no_data') {
    return (
      <div className="market-cell market-cell-empty">
        <span className="text-xs text-gray-500">N/A</span>
      </div>
    );
  }

  const cls = overall.signal === 'high' ? 'market-cell-high'
    : overall.signal === 'low' ? 'market-cell-low' : 'market-cell-avg';
  const TrendIcon = overall.trend === 'up' ? TrendingUp : overall.trend === 'down' ? TrendingDown : Minus;

  return (
    <div className={`market-cell ${cls} min-w-[100px]`}>
      <div className="flex items-center justify-center gap-1">
        <TrendIcon className="w-3.5 h-3.5" />
        <span className="text-xs font-bold">{overall.label}</span>
      </div>
      <span className="font-mono text-sm font-bold mt-1">{overall.score}</span>
      <span className="text-[10px] opacity-80">{overall.avgGrowth > 0 ? '+' : ''}{overall.avgGrowth}% avg</span>
    </div>
  );
}

function StaffMarketMatrix({ matrix }) {
  if (!matrix?.rows?.length) {
    return (
      <div className="card p-8 text-center text-gray-500 text-sm">
        No staff data yet. Add businesses and staff to see the performance board.
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-semibold">Staff performance board</h3>
          <p className="text-xs text-gray-500">All staff · all businesses · live entry signals</p>
        </div>
        <div className="flex flex-wrap gap-3 text-[10px] font-medium">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-500" /> HIGH ▲</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-500" /> AVG ●</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500" /> LOW ▼</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-400" /> No entry</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800/80 text-left text-xs text-gray-500 uppercase tracking-wide">
              <th className="px-3 py-3 sticky left-0 z-20 bg-gray-50 dark:bg-gray-800/95 min-w-[120px]">Business</th>
              <th className="px-3 py-3 sticky left-[120px] z-20 bg-gray-50 dark:bg-gray-800/95 min-w-[130px] border-r border-gray-200 dark:border-gray-700">Staff</th>
              {matrix.columns.map((col) => (
                <th key={col.slug} className="px-2 py-3 text-center min-w-[88px]">
                  <span className="text-base block">{ICON_MAP[col.slug] || ICON_MAP[col.icon] || '📊'}</span>
                  <span className="normal-case font-medium text-[11px]">{col.name}</span>
                </th>
              ))}
              <th className="px-3 py-3 text-center sticky right-0 z-20 bg-primary-50 dark:bg-primary-900/30 min-w-[110px] border-l-2 border-primary-200 dark:border-primary-800">
                Overall
              </th>
            </tr>
          </thead>
          <tbody>
            {matrix.rows.map((row) => (
              <tr key={`${row.businessId}-${row.staffId}`} className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                <td className="px-3 py-2 sticky left-0 z-10 bg-white dark:bg-gray-900 font-medium text-xs">
                  {row.businessName}
                </td>
                <td className="px-3 py-2 sticky left-[120px] z-10 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
                  <p className="font-medium text-sm">{row.staffName}</p>
                  <p className="text-[10px] text-gray-500">{row.points} pts · 🔥{row.streak}</p>
                </td>
                {matrix.columns.map((col) => (
                  <td key={col.slug} className="px-1.5 py-2">
                    <MarketCell cell={row.cells[col.slug]} />
                  </td>
                ))}
                <td className="px-2 py-2 sticky right-0 z-10 bg-white dark:bg-gray-900 border-l-2 border-primary-100 dark:border-primary-900/50">
                  <OverallCell overall={row.overall} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

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
      <style>{`
        .market-cell {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 6px 4px;
          border-radius: 8px;
          min-height: 64px;
          border: 1px solid transparent;
        }
        .market-cell-high {
          background: linear-gradient(180deg, rgba(34,197,94,0.15) 0%, rgba(34,197,94,0.05) 100%);
          border-color: rgba(34,197,94,0.35);
          color: rgb(21 128 61);
        }
        .dark .market-cell-high { color: rgb(134 239 172); }
        .market-cell-low {
          background: linear-gradient(180deg, rgba(239,68,68,0.15) 0%, rgba(239,68,68,0.05) 100%);
          border-color: rgba(239,68,68,0.35);
          color: rgb(185 28 28);
        }
        .dark .market-cell-low { color: rgb(252 165 165); }
        .market-cell-avg {
          background: linear-gradient(180deg, rgba(234,179,8,0.15) 0%, rgba(234,179,8,0.05) 100%);
          border-color: rgba(234,179,8,0.35);
          color: rgb(161 98 7);
        }
        .dark .market-cell-avg { color: rgb(253 224 71); }
        .market-cell-empty, .market-cell-na {
          background: rgba(156,163,175,0.08);
          border-color: rgba(156,163,175,0.2);
        }
      `}</style>

      <div>
        <Link to="/super-admin" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2">
          <ArrowLeft className="w-4 h-4" /> Super Admin
        </Link>
        <h1 className="text-2xl font-bold">Business Comparison</h1>
        <p className="text-gray-500">Stock-style view of every staff member across all modules and businesses</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <select className="input w-auto" value={period} onChange={(e) => setPeriod(e.target.value)}>
          <option value="weekly">This Week</option>
          <option value="monthly">This Month</option>
          <option value="quarterly">This Quarter</option>
          <option value="yearly">This Year</option>
        </select>
      </div>

      {loading ? (
        <div className="card p-12 text-center text-gray-500">Loading performance board...</div>
      ) : !data?.businesses?.length ? (
        <EmptyState icon={Building2} title="No businesses" subtitle="Add businesses from Super Admin to compare them here" />
      ) : (
        <>
          {data?.summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="card p-4">
                <p className="text-xs text-gray-500">Businesses</p>
                <p className="text-2xl font-bold">{data.summary.totalBusinesses}</p>
              </div>
              <div className="card p-4">
                <p className="text-xs text-gray-500">Staff tracked</p>
                <p className="text-2xl font-bold">{data.summary.totalStaff ?? data.staffMatrix?.rows?.length ?? 0}</p>
              </div>
              <div className="card p-4">
                <p className="text-xs text-gray-500">Entries (period)</p>
                <p className="text-2xl font-bold">{data.summary.totalEntries}</p>
              </div>
              <div className="card p-4">
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-green-500" /> Top business
                </p>
                <p className="text-sm font-bold mt-1 truncate">{data.summary.topBusiness?.name || '—'}</p>
              </div>
            </div>
          )}

          <StaffMarketMatrix matrix={data.staffMatrix} />

          {chartData.length > 1 && (
            <div className="card p-6">
              <h3 className="font-semibold mb-4 text-sm text-gray-500">Business avg growth comparison</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip
                    formatter={(v) => [`${v}%`, 'Avg Growth']}
                    labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName || ''}
                  />
                  <Bar dataKey="growth" radius={[4, 4, 0, 0]}>
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  );
}
