import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Plus, Package } from 'lucide-react';
import { moduleAPI } from '../services/api';

const iconMap = {
  instagram: '📸',
  whatsapp: '💬',
  youtube: '📺',
  facebook: '📘',
  linkedin: '💼',
  google: '📍',
  'google-my-business': '📍',
  'chart-bar': '📊',
};

export default function Modules() {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    setLoading(true);
    moduleAPI.list({ isActive: true })
      .then((res) => setModules(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [location.key]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Modules</h1>
          <p className="text-gray-500">Manage tracking modules</p>
        </div>
        <Link to="/modules/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Create Module
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card p-6 animate-pulse h-40" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((mod) => (
            <div key={mod._id} className="card p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                    style={{ backgroundColor: `${mod.color}20` }}
                  >
                    {iconMap[mod.icon] || '📊'}
                  </div>
                  <div>
                    <h3 className="font-semibold">{mod.name}</h3>
                    <p className="text-xs text-gray-500">{mod.fields?.length || 0} fields</p>
                  </div>
                </div>
                {mod.isDefault && (
                  <span className="text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 px-2 py-1 rounded-full">
                    Default
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-3 line-clamp-2">{mod.description || 'No description'}</p>
              <div className="mt-4 flex flex-wrap gap-1">
                {mod.fields?.slice(0, 4).map((f) => (
                  <span key={f.slug} className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                    {f.name}
                  </span>
                ))}
                {mod.fields?.length > 4 && (
                  <span className="text-xs text-gray-400">+{mod.fields.length - 4} more</span>
                )}
              </div>
              <Link to={`/modules/${mod._id}/edit`} className="mt-4 text-sm text-primary-600 hover:text-primary-700 font-medium inline-block">
                Edit Module →
              </Link>
            </div>
          ))}
        </div>
      )}

      {!loading && modules.length === 0 && (
        <div className="card p-12 text-center">
          <Package className="w-12 h-12 text-gray-300 mx-auto" />
          <p className="mt-4 text-gray-500">No modules yet. Create your first tracking module.</p>
        </div>
      )}
    </div>
  );
}
