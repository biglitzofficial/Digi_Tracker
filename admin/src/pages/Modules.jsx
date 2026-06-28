import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Plus, Package, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
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
  const [deletingId, setDeletingId] = useState(null);
  const location = useLocation();

  const loadModules = () => {
    setLoading(true);
    moduleAPI.list({ isActive: true })
      .then((res) => setModules(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadModules();
  }, [location.key]);

  const handleDelete = async (mod) => {
    if (!confirm(`Delete "${mod.name}"? Existing entries for this module will remain in history.`)) return;

    setDeletingId(mod._id);
    try {
      await moduleAPI.delete(mod._id);
      toast.success('Module deleted');
      setModules((prev) => prev.filter((m) => m._id !== mod._id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete module');
    } finally {
      setDeletingId(null);
    }
  };

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
              <div className="mt-4 flex items-center justify-between gap-3">
                <Link to={`/modules/${mod._id}/edit`} className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                  Edit Module →
                </Link>
                <button
                  type="button"
                  onClick={() => handleDelete(mod)}
                  disabled={deletingId === mod._id}
                  className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  {deletingId === mod._id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
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
