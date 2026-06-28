import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { businessAPI } from '../services/api';
import { parseApiError } from '../utils/apiError';

export default function Settings() {
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    businessAPI.getMe()
      .then((res) => setBusiness(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await businessAPI.update(business);
      setBusiness(data.data);
      toast.success('Settings saved');
    } catch (err) {
      toast.error(parseApiError(err, 'Failed to save settings'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-gray-500">Loading settings...</p>;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-gray-500">Business profile and preferences</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="card p-6 space-y-4">
          <h3 className="font-semibold">Business Profile</h3>
          <div>
            <label className="text-sm font-medium">Business Name</label>
            <input className="input mt-1" value={business?.name || ''} onChange={(e) => setBusiness({ ...business, name: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium">Business Type</label>
            <select className="input mt-1" value={business?.type || ''} onChange={(e) => setBusiness({ ...business, type: e.target.value })}>
              {['gym', 'fitness_center', 'restaurant', 'real_estate', 'digital_marketing', 'coaching', 'salon', 'clinic', 'retail', 'other'].map((t) => (
                <option key={t} value={t}>{t.replace('_', ' ')}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Contact Number</label>
            <input className="input mt-1" value={business?.contactNumber || ''} onChange={(e) => setBusiness({ ...business, contactNumber: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium">Timezone</label>
            <input className="input mt-1" value={business?.timezone || ''} onChange={(e) => setBusiness({ ...business, timezone: e.target.value })} />
          </div>
        </div>

        <div className="card p-6 space-y-4">
          <h3 className="font-semibold">Branding</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Primary Color</label>
              <input type="color" className="input mt-1 h-10" value={business?.branding?.primaryColor || '#6366F1'} onChange={(e) => setBusiness({ ...business, branding: { ...business.branding, primaryColor: e.target.value } })} />
            </div>
            <div>
              <label className="text-sm font-medium">Secondary Color</label>
              <input type="color" className="input mt-1 h-10" value={business?.branding?.secondaryColor || '#8B5CF6'} onChange={(e) => setBusiness({ ...business, branding: { ...business.branding, secondaryColor: e.target.value } })} />
            </div>
          </div>
        </div>

        <div className="card p-6 space-y-4">
          <h3 className="font-semibold">Notifications</h3>
          <div>
            <label className="text-sm font-medium">Daily Entry Reminder Time</label>
            <input type="time" className="input mt-1 w-auto" value={business?.settings?.entryReminderTime || '09:00'} onChange={(e) => setBusiness({ ...business, settings: { ...business.settings, entryReminderTime: e.target.value } })} />
          </div>
          <div>
            <label className="text-sm font-medium">Currency</label>
            <select className="input mt-1 w-auto" value={business?.settings?.currency || 'USD'} onChange={(e) => setBusiness({ ...business, settings: { ...business.settings, currency: e.target.value } })}>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="INR">INR</option>
            </select>
          </div>
        </div>

        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
}
