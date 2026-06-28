import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Trash2, GripVertical, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { moduleAPI } from '../services/api';

const FIELD_TYPES = ['number', 'text', 'date', 'dropdown', 'boolean', 'currency', 'percentage'];

const emptyField = () => ({ name: '', type: 'number', required: false, options: [], order: 0 });

export default function ModuleBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    name: '', description: '', icon: 'chart-bar', color: '#6366F1', fields: [emptyField()],
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEdit) {
      moduleAPI.get(id).then((res) => {
        const mod = res.data.data;
        setForm({
          name: mod.name,
          description: mod.description || '',
          icon: mod.icon,
          color: mod.color,
          fields: mod.fields.map((f) => ({
            name: f.name, type: f.type, required: f.required,
            options: f.options || [], order: f.order,
          })),
        });
      });
    }
  }, [id, isEdit]);

  const updateField = (index, key, value) => {
    const fields = [...form.fields];
    fields[index] = { ...fields[index], [key]: value };
    setForm({ ...form, fields });
  };

  const addField = () => {
    setForm({ ...form, fields: [...form.fields, { ...emptyField(), order: form.fields.length }] });
  };

  const removeField = (index) => {
    if (form.fields.length <= 1) return;
    setForm({ ...form, fields: form.fields.filter((_, i) => i !== index) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        fields: form.fields.map((f, i) => ({ ...f, order: i })),
      };
      if (isEdit) {
        await moduleAPI.update(id, payload);
        toast.success('Module updated');
      } else {
        await moduleAPI.create(payload);
        toast.success('Module created');
      }
      navigate('/modules');
    } catch (err) {
      const details = err.response?.data?.errors?.map((e) => e.message).join(', ');
      toast.error(details || err.response?.data?.message || 'Failed to save module');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button onClick={() => navigate('/modules')} className="flex items-center gap-2 text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" /> Back to Modules
      </button>

      <div>
        <h1 className="text-2xl font-bold">{isEdit ? 'Edit Module' : 'Create Custom Module'}</h1>
        <p className="text-gray-500">Define tracking fields — no coding required</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card p-6 space-y-4">
          <h3 className="font-semibold">Module Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-sm font-medium">Module Name *</label>
              <input className="input mt-1" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. YouTube Channel" />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium">Description</label>
              <textarea className="input mt-1" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Icon</label>
              <input className="input mt-1" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} placeholder="chart-bar" />
            </div>
            <div>
              <label className="text-sm font-medium">Color</label>
              <input type="color" className="input mt-1 h-10" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Fields</h3>
            <button type="button" onClick={addField} className="btn-secondary flex items-center gap-1 text-sm">
              <Plus className="w-4 h-4" /> Add Field
            </button>
          </div>

          <div className="space-y-3">
            {form.fields.map((field, index) => (
              <div key={index} className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <GripVertical className="w-5 h-5 text-gray-400 mt-2 shrink-0" />
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-500">Name</label>
                    <input className="input mt-1" required value={field.name} onChange={(e) => updateField(index, 'name', e.target.value)} placeholder="Followers" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500">Type</label>
                    <select className="input mt-1" value={field.type} onChange={(e) => updateField(index, 'type', e.target.value)}>
                      {FIELD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="flex items-end gap-3">
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={field.required} onChange={(e) => updateField(index, 'required', e.target.checked)} />
                      Required
                    </label>
                    <button type="button" onClick={() => removeField(index)} className="text-red-500 hover:text-red-700">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  {field.type === 'dropdown' && (
                    <div className="md:col-span-3">
                      <label className="text-xs font-medium text-gray-500">Options (comma-separated)</label>
                      <input
                        className="input mt-1"
                        value={field.options.join(', ')}
                        onChange={(e) => updateField(index, 'options', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
                        placeholder="Option 1, Option 2, Option 3"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button type="button" className="btn-secondary" onClick={() => navigate('/modules')}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Saving...' : isEdit ? 'Update Module' : 'Create Module'}
          </button>
        </div>
      </form>
    </div>
  );
}
