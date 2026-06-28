import { useEffect, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { Building2, CreditCard, Shield, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { businessAPI, planAPI } from '../services/api';
import { parseApiError } from '../utils/apiError';
import { setActiveBusinessId } from '../components/BusinessSwitcher';
import EmptyState from '../components/EmptyState';

const emptyForm = () => ({
  name: '',
  type: 'gym',
  email: '',
  contactNumber: '',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  ownerFirstName: '',
  ownerLastName: '',
  ownerEmail: '',
  ownerPassword: '',
});

const BUSINESS_TYPES = [
  'gym', 'fitness_center', 'restaurant', 'real_estate', 'digital_marketing',
  'coaching', 'salon', 'clinic', 'retail', 'other',
];

export default function SuperAdmin() {
  const { user, loading: authLoading } = useAuth();
  const [tab, setTab] = useState('businesses');
  const [businesses, setBusinesses] = useState([]);
  const [plans, setPlans] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm());

  const load = async () => {
    setLoading(true);
    try {
      const [bizRes, planRes, subRes] = await Promise.all([
        businessAPI.list(),
        planAPI.list(),
        planAPI.listSubscriptions(),
      ]);
      setBusinesses(bizRes.data.data);
      setPlans(planRes.data.data);
      setSubscriptions(subRes.data.data);
    } catch {
      toast.error('Failed to load super admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSubscriptionUpdate = async (businessId, status) => {
    try {
      await planAPI.updateSubscription(businessId, { status });
      toast.success('Subscription updated');
      const { data } = await planAPI.listSubscriptions();
      setSubscriptions(data.data);
    } catch (err) {
      toast.error(parseApiError(err, 'Update failed'));
    }
  };

  const handleCreateBusiness = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await businessAPI.create(form);
      toast.success(data.message || 'Business created with default modules');
      setShowModal(false);
      setActiveBusinessId(data.data.business._id);
      window.location.reload();
    } catch (err) {
      toast.error(parseApiError(err, 'Failed to create business'));
    } finally {
      setSaving(false);
    }
  };

  const selectBusiness = (id) => {
    setActiveBusinessId(id);
    toast.success('Business selected — reload to manage it');
    window.location.reload();
  };

  const handleDeleteBusiness = async (business) => {
    const confirmed = window.confirm(
      `Delete "${business.name}" permanently?\n\nThis removes all staff, modules, entries, and subscription data for this business. This cannot be undone.`
    );
    if (!confirmed) return;

    try {
      await businessAPI.delete(business._id);
      const activeId = localStorage.getItem('activeBusinessId');
      if (activeId === business._id) {
        localStorage.removeItem('activeBusinessId');
      }
      toast.success(`"${business.name}" deleted`);
      load();
    } catch (err) {
      toast.error(parseApiError(err, 'Failed to delete business'));
    }
  };

  const tabs = [
    { id: 'businesses', label: 'Businesses', icon: Building2 },
    { id: 'plans', label: 'Plans', icon: CreditCard },
    { id: 'subscriptions', label: 'Subscriptions', icon: Shield },
  ];

  if (authLoading) return <div className="py-12 text-center text-gray-500">Loading...</div>;
  if (user?.role !== 'super_admin') return <Navigate to="/" replace />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Super Admin</h1>
          <p className="text-gray-500">Add businesses — each gets its own modules, staff, and data</p>
        </div>
        {tab === 'businesses' && (
          <button type="button" className="btn-primary flex items-center gap-2" onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4" /> Add Business
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${tab === id ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
        <Link
          to="/super-admin/business-analytics"
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 hover:bg-primary-100"
        >
          All Businesses Analytics →
        </Link>
        <Link
          to="/super-admin/staff-performance"
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 hover:bg-primary-100"
        >
          Staff Performance Reports →
        </Link>
      </div>

      {loading ? (
        <div className="card p-12 text-center text-gray-500">Loading...</div>
      ) : tab === 'businesses' ? (
        <div className="card overflow-hidden">
          {businesses.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="No businesses yet"
              subtitle='Click "Add Business" to create one with default modules (Instagram, WhatsApp, YouTube, etc.)'
            />
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr className="text-left text-gray-500">
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Timezone</th>
                  <th className="px-6 py-3">Created</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {businesses.map((b) => (
                  <tr key={b._id} className="border-t border-gray-100 dark:border-gray-800">
                    <td className="px-6 py-4 font-medium">{b.name}</td>
                    <td className="px-6 py-4 capitalize">{b.type?.replace('_', ' ')}</td>
                    <td className="px-6 py-4 text-gray-500">{b.email}</td>
                    <td className="px-6 py-4 text-gray-500">{b.timezone}</td>
                    <td className="px-6 py-4 text-gray-500">{new Date(b.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                          onClick={() => selectBusiness(b._id)}
                        >
                          Manage →
                        </button>
                        <button
                          type="button"
                          className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
                          onClick={() => handleDeleteBusiness(b)}
                          title={`Delete ${b.name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : tab === 'plans' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((p) => (
            <div key={p._id} className="card p-6">
              <h3 className="font-bold text-lg">{p.name}</h3>
              <p className="text-3xl font-bold text-primary-600 mt-2">${p.price}<span className="text-sm text-gray-500">/mo</span></p>
              <ul className="mt-4 space-y-2 text-sm text-gray-500">
                <li>{p.limits?.maxStaff || '∞'} staff members</li>
                <li>{p.limits?.maxModules || '∞'} modules</li>
                <li>{p.limits?.maxEntriesPerMonth || '∞'} entries/month</li>
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr className="text-left text-gray-500">
                <th className="px-6 py-3">Business</th>
                <th className="px-6 py-3">Plan</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Trial Ends</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((s) => (
                <tr key={s._id} className="border-t border-gray-100 dark:border-gray-800">
                  <td className="px-6 py-4 font-medium">{s.businessId?.name || '—'}</td>
                  <td className="px-6 py-4">{s.planId?.name || '—'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                      s.status === 'active' ? 'bg-green-100 text-green-700' :
                      s.status === 'trial' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                    }`}>{s.status}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {s.trialEndsAt ? new Date(s.trialEndsAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-6 py-4">
                    <select
                      className="input w-auto text-xs py-1"
                      value={s.status}
                      onChange={(e) => handleSubscriptionUpdate(s.businessId?._id || s.businessId, e.target.value)}
                    >
                      {['trial', 'active', 'cancelled', 'expired'].map((st) => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-1">Add Business</h2>
            <p className="text-sm text-gray-500 mb-6">
              Creates the business, owner login, 14-day trial, and all default tracking modules.
            </p>
            <form onSubmit={handleCreateBusiness} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Business Name *</label>
                <input className="input mt-1" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">Business Type *</label>
                <select className="input mt-1" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  {BUSINESS_TYPES.map((t) => (
                    <option key={t} value={t}>{t.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Business Email *</label>
                <input type="email" className="input mt-1" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">Contact Number</label>
                <input className="input mt-1" value={form.contactNumber} onChange={(e) => setForm({ ...form, contactNumber: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">Timezone</label>
                <input className="input mt-1" value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })} />
              </div>
              <hr className="border-gray-200 dark:border-gray-700" />
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Business Owner Account</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">First Name *</label>
                  <input className="input mt-1" required value={form.ownerFirstName} onChange={(e) => setForm({ ...form, ownerFirstName: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium">Last Name *</label>
                  <input className="input mt-1" required value={form.ownerLastName} onChange={(e) => setForm({ ...form, ownerLastName: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Owner Email *</label>
                <input type="email" className="input mt-1" required value={form.ownerEmail} onChange={(e) => setForm({ ...form, ownerEmail: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">Owner Password *</label>
                <input type="password" className="input mt-1" required minLength={8} value={form.ownerPassword} onChange={(e) => setForm({ ...form, ownerPassword: e.target.value })} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" className="btn-secondary flex-1" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary flex-1" disabled={saving}>
                  {saving ? 'Creating...' : 'Create Business'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
