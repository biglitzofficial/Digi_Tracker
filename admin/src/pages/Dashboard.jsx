import { useEffect, useState } from 'react';
import { Package, Users, FileText, TrendingUp, TrendingDown } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import KpiCard from '../components/KpiCard';
import { analyticsAPI } from '../services/api';

export default function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [insights, setInsights] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsAPI.overview()
      .then(({ data }) => {
        setDashboard(data.data.dashboard);
        setInsights(data.data.insights);
        setChartData(data.data.chartData || []);
        setLeaderboard(data.data.leaderboard || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-40 animate-pulse" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-56 mt-2 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mt-3" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 card p-6 animate-pulse h-80" />
          <div className="card p-6 animate-pulse h-80" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-gray-500">Business growth overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard title="Total Modules" value={dashboard?.totalModules || 0} icon={Package} color="primary" />
        <KpiCard title="Total Staff" value={dashboard?.totalStaff || 0} icon={Users} color="blue" />
        <KpiCard title="Total Entries" value={dashboard?.totalEntries || 0} icon={FileText} color="green" />
        <KpiCard
          title="Best Module"
          value={dashboard?.bestPerformingModule?.name || 'N/A'}
          trend={dashboard?.bestPerformingModule?.growth}
          icon={TrendingUp}
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-6">
          <h3 className="font-semibold mb-4">Growth Trends</h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Area type="monotone" dataKey="value" stroke="#6366F1" fill="url(#colorValue)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-12">No chart data available yet</p>
          )}
        </div>

        <div className="card p-6">
          <h3 className="font-semibold mb-4">Insights</h3>
          <div className="space-y-4">
            {insights?.fastestGrowingChannel && (
              <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium">Fastest Growing</p>
                  <p className="text-xs text-gray-500">{insights.fastestGrowingChannel.module} (+{insights.fastestGrowingChannel.growth}%)</p>
                </div>
              </div>
            )}
            {insights?.slowestGrowingChannel && (
              <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <TrendingDown className="w-5 h-5 text-red-500" />
                <div>
                  <p className="text-sm font-medium">Slowest Growing</p>
                  <p className="text-xs text-gray-500">{insights.slowestGrowingChannel.module} ({insights.slowestGrowingChannel.growth}%)</p>
                </div>
              </div>
            )}
            <div className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
              <p className="text-sm font-medium">Consistency Score</p>
              <p className="text-2xl font-bold text-primary-600">{insights?.consistencyScore || 0}%</p>
            </div>
            {insights?.bestMonth && (
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-sm font-medium">Best Month</p>
                <p className="text-xs text-gray-500">{insights.bestMonth.period}: +{insights.bestMonth.growth}%</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="font-semibold mb-4">Staff Leaderboard</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-200 dark:border-gray-800">
                <th className="pb-3 font-medium">Rank</th>
                <th className="pb-3 font-medium">Name</th>
                <th className="pb-3 font-medium">Points</th>
                <th className="pb-3 font-medium">Streak</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((item) => (
                <tr key={item.userId} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-3">
                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${item.rank === 1 ? 'bg-yellow-100 text-yellow-700' : item.rank === 2 ? 'bg-gray-100 text-gray-600' : item.rank === 3 ? 'bg-orange-100 text-orange-700' : 'bg-gray-50 text-gray-500'}`}>
                      {item.rank}
                    </span>
                  </td>
                  <td className="py-3 font-medium">{item.name}</td>
                  <td className="py-3">{item.points}</td>
                  <td className="py-3">🔥 {item.streak}</td>
                </tr>
              ))}
              {leaderboard.length === 0 && (
                <tr><td colSpan={4} className="py-8 text-center text-gray-500">No leaderboard data yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
