import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { entryAPI, moduleAPI } from '../services/api';
import { parseApiError } from '../utils/apiError';

const iconMap = {
  instagram: '📸',
  whatsapp: '💬',
  youtube: '📺',
  facebook: '📘',
  linkedin: '💼',
  google: '📍',
  'google-my-business': '📍',
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function buildInitialValues(fields, existingValues = []) {
  const values = {};
  for (const field of fields.filter((f) => f.isActive !== false)) {
    const existing = existingValues.find((v) => v.fieldSlug === field.slug);
    if (field.type === 'boolean') {
      values[field.slug] = existing?.value === true;
    } else if (existing?.value != null && existing.value !== '') {
      values[field.slug] = existing.value;
    } else {
      values[field.slug] = field.type === 'boolean' ? false : '';
    }
  }
  return values;
}

function FieldInput({ field, value, onChange }) {
  const label = `${field.name}${field.required ? ' *' : ''}`;

  if (field.type === 'boolean') {
    return (
      <label className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 cursor-pointer">
        <span className="font-medium">{label}</span>
        <input
          type="checkbox"
          className="w-5 h-5 rounded border-gray-300 text-primary-600"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
        />
      </label>
    );
  }

  if (field.type === 'dropdown') {
    return (
      <div>
        <label className="block text-sm font-medium mb-1.5">{label}</label>
        <select
          className="input"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
        >
          <option value="">Select...</option>
          {(field.options || []).map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>
    );
  }

  if (field.type === 'date') {
    return (
      <div>
        <label className="block text-sm font-medium mb-1.5">{label}</label>
        <input
          type="date"
          className="input"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
        />
      </div>
    );
  }

  const isNumeric = ['number', 'currency', 'percentage'].includes(field.type);
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">{label}</label>
      <div className="relative">
        {field.type === 'currency' && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
        )}
        {field.type === 'percentage' && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">%</span>
        )}
        <input
          type={isNumeric ? 'number' : 'text'}
          step={isNumeric ? 'any' : undefined}
          min={isNumeric ? 0 : undefined}
          className={`input ${field.type === 'currency' ? 'pl-7' : ''}`}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
        />
      </div>
    </div>
  );
}

export default function EntryForm() {
  const { moduleId, id: entryId } = useParams();
  const isEdit = Boolean(entryId);
  const navigate = useNavigate();

  const [module, setModule] = useState(null);
  const [fieldValues, setFieldValues] = useState({});
  const [entryDate, setEntryDate] = useState(todayISO());
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        if (isEdit) {
          const { data: entryRes } = await entryAPI.get(entryId);
          const entry = entryRes.data;
          const modId = entry.moduleId?._id || entry.moduleId;
          const { data: modRes } = await moduleAPI.get(modId);
          const mod = modRes.data;
          setModule(mod);
          setFieldValues(buildInitialValues(mod.fields || [], entry.values || []));
          setEntryDate(new Date(entry.entryDate).toISOString().slice(0, 10));
          setNotes(entry.notes || '');
        } else {
          const { data: modRes } = await moduleAPI.get(moduleId);
          const mod = modRes.data;
          setModule(mod);
          setFieldValues(buildInitialValues(mod.fields || []));
        }
      } catch {
        toast.error('Failed to load entry form');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [moduleId, entryId, isEdit, navigate]);

  const activeFields = (module?.fields || []).filter((f) => f.isActive !== false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!module) return;

    const values = [];
    for (const field of activeFields) {
      let raw = fieldValues[field.slug];
      const isNumeric = ['number', 'currency', 'percentage'].includes(field.type);

      if (isNumeric) {
        if (raw === '' || raw == null) {
          if (field.required) {
            toast.error(`"${field.name}" is required`);
            return;
          }
          raw = 0;
        } else {
          raw = parseFloat(raw);
          if (Number.isNaN(raw)) {
            toast.error(`"${field.name}" must be a number`);
            return;
          }
          if (raw < 0) {
            toast.error(`"${field.name}" cannot be negative`);
            return;
          }
          if (field.type === 'percentage' && raw > 100) {
            toast.error(`"${field.name}" cannot exceed 100%`);
            return;
          }
        }
      } else if (field.required && (raw === '' || raw == null)) {
        toast.error(`"${field.name}" is required`);
        return;
      }

      values.push({ fieldSlug: field.slug, value: isNumeric ? raw : raw ?? '' });
    }

    setSubmitting(true);
    try {
      const payload = { values, notes: notes.trim() };
      if (isEdit) {
        await entryAPI.update(entryId, payload);
        toast.success('Entry updated');
      } else {
        await entryAPI.create({
          moduleId: module._id,
          entryDate,
          ...payload,
        });
        toast.success('Entry submitted');
      }
      navigate('/');
    } catch (err) {
      toast.error(parseApiError(err, 'Failed to save entry'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-gray-500">Loading form...</div>;
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-3">
          <ArrowLeft className="w-4 h-4" /> Back to Today
        </Link>
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
            style={{ backgroundColor: `${module.color}20` }}
          >
            {iconMap[module.icon] || '📊'}
          </div>
          <div>
            <h1 className="text-2xl font-bold">
              {isEdit ? `Edit ${module.name}` : `${module.name} Entry`}
            </h1>
            <p className="text-gray-500">
              {isEdit ? 'Update today\'s metrics' : 'Fill in today\'s metrics'}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {!isEdit && (
          <div className="card p-4">
            <label className="block text-sm font-medium mb-1.5 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary-500" /> Entry Date
            </label>
            <input
              type="date"
              className="input w-auto"
              value={entryDate}
              max={todayISO()}
              onChange={(e) => setEntryDate(e.target.value)}
              required
            />
          </div>
        )}

        <div className="card p-6 space-y-4">
          <h2 className="font-semibold">Metrics</h2>
          {activeFields.map((field) => (
            <FieldInput
              key={field.slug}
              field={field}
              value={fieldValues[field.slug]}
              onChange={(val) => setFieldValues((prev) => ({ ...prev, [field.slug]: val }))}
            />
          ))}
        </div>

        <div className="card p-6">
          <label className="block text-sm font-medium mb-1.5">Notes (optional)</label>
          <textarea
            className="input min-h-[80px]"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any additional context..."
          />
        </div>

        <button type="submit" className="btn-primary w-full py-3" disabled={submitting}>
          {submitting ? 'Saving...' : isEdit ? 'Update Entry' : 'Submit Entry'}
        </button>
      </form>
    </div>
  );
}
