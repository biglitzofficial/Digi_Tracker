import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import { moduleAPI } from '../services/api';
import { parseApiError } from '../utils/apiError';

const NUMERIC_TYPES = ['number', 'currency', 'percentage'];

export default function OpeningBalanceModal({ moduleId, moduleName, onClose, onSaved }) {
  const [module, setModule] = useState(null);
  const [balances, setBalances] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    moduleAPI.get(moduleId)
      .then((res) => {
        const mod = res.data.data;
        setModule(mod);
        const initial = {};
        for (const field of mod.fields || []) {
          if (NUMERIC_TYPES.includes(field.type)) {
            initial[field.slug] = field.openingBalance ?? '';
          }
        }
        setBalances(initial);
      })
      .catch(() => toast.error('Failed to load module'))
      .finally(() => setLoading(false));
  }, [moduleId]);

  const numericFields = (module?.fields || []).filter(
    (f) => NUMERIC_TYPES.includes(f.type) && f.isActive !== false
  );

  const handleSave = async (e) => {
    e.preventDefault();
    if (!module) return;

    setSaving(true);
    try {
      const fields = module.fields.map((f) => {
        if (!NUMERIC_TYPES.includes(f.type)) return f;
        const raw = balances[f.slug];
        return {
          ...f,
          openingBalance: raw === '' || raw == null ? undefined : parseFloat(raw),
        };
      });

      await moduleAPI.update(moduleId, { fields });
      toast.success('Opening balances saved');
      onSaved?.();
      onClose();
    } catch (err) {
      toast.error(parseApiError(err, 'Failed to save opening balances'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="card w-full max-w-md max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold">Opening Balances</h2>
            <p className="text-sm text-gray-500 mt-1">{moduleName}</p>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-gray-500 mb-4">
          Set the starting value for each metric before you began tracking. Growth analytics use these as the baseline.
        </p>

        {loading ? (
          <p className="text-center py-8 text-gray-500">Loading...</p>
        ) : numericFields.length === 0 ? (
          <p className="text-gray-500 text-sm py-4">This module has no numeric fields.</p>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            {numericFields.map((field) => (
              <div key={field.slug}>
                <label className="text-sm font-medium">{field.name}</label>
                <input
                  type="number"
                  min={0}
                  step="any"
                  className="input mt-1"
                  placeholder="e.g. 5000"
                  value={balances[field.slug] ?? ''}
                  onChange={(e) => setBalances({ ...balances, [field.slug]: e.target.value })}
                />
              </div>
            ))}
            <div className="flex gap-3 pt-2">
              <button type="button" className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn-primary flex-1" disabled={saving}>
                {saving ? 'Saving...' : 'Save Balances'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
