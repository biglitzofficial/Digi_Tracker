import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Circle, Flame, Trophy, ClipboardList } from 'lucide-react';
import { entryAPI, rewardAPI } from '../services/api';

const iconMap = {
  instagram: '📸',
  whatsapp: '💬',
  youtube: '📺',
  facebook: '📘',
  linkedin: '💼',
  google: '📍',
  'google-my-business': '📍',
};

export default function StaffDashboard() {
  const [status, setStatus] = useState(null);
  const [rewards, setRewards] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([entryAPI.todayStatus(), rewardAPI.me()])
      .then(([statusRes, rewardsRes]) => {
        setStatus(statusRes.data.data);
        setRewards(rewardsRes.data.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card p-6 animate-pulse h-28" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Today&apos;s Tasks</h1>
        <p className="text-gray-500">Submit your daily metrics for each module</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6">
          <p className="text-sm text-gray-500">Completion</p>
          <p className="text-3xl font-bold mt-1">{status?.completionRate ?? 0}%</p>
          <p className="text-sm text-gray-500 mt-1">
            {status?.submitted ?? 0} of {status?.total ?? 0} modules done
          </p>
        </div>
        <div className="card p-6">
          <p className="text-sm text-gray-500 flex items-center gap-1">
            <Trophy className="w-4 h-4 text-yellow-500" /> Points
          </p>
          <p className="text-3xl font-bold mt-1">{rewards?.totalPoints ?? 0}</p>
        </div>
        <div className="card p-6">
          <p className="text-sm text-gray-500 flex items-center gap-1">
            <Flame className="w-4 h-4 text-orange-500" /> Streak
          </p>
          <p className="text-3xl font-bold mt-1">{rewards?.currentStreak ?? 0} days</p>
          <p className="text-sm text-gray-500 mt-1">Best: {rewards?.longestStreak ?? 0} days</p>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Module checklist</h2>
          <Link to="/entries" className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
            <ClipboardList className="w-4 h-4" /> View history
          </Link>
        </div>

        {status?.modules?.length ? (
          <div className="space-y-3">
            {status.modules.map((mod) => (
              <div
                key={mod.moduleId}
                className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50"
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0"
                  style={{ backgroundColor: `${mod.color}20` }}
                >
                  {iconMap[mod.icon] || '📊'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{mod.name}</p>
                  <p className="text-xs text-gray-500">
                    {mod.submitted ? 'Submitted for today' : 'Pending submission'}
                  </p>
                </div>
                {mod.submitted ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-gray-300 shrink-0" />
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No active modules assigned yet.</p>
        )}

        <p className="text-sm text-gray-500 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          Use the DigiTracker mobile app to submit and edit today&apos;s entries.
        </p>
      </div>
    </div>
  );
}
