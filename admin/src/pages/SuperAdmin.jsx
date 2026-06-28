import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Building2, CreditCard, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { businessAPI, planAPI } from '../services/api';
import { parseApiError } from '../utils/apiError';
import EmptyState from '../components/EmptyState';

export default function SuperAdmin() {
  const { user, loading: authLoading } = useAuth();
  const [tab, setTab] = useState('businesses');
  const [businesses, setBusinesses] = useState([]);
  const [plans, setPlans] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    load();
  }, []);

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

  const tabs = [
    { id: 'businesses', label: 'Businesses', icon: Building2 },
    { id: 'plans', label: 'Plans', icon: CreditCard },
    { id: 'subscriptions', label: 'Subscriptions', icon: Shield },
  ];

  if (authLoading) return <div className="py-12 text-center text-gray-500">Loading...</div>;
  if (user?.role !== 'super_admin') return <Navigate to="/" replace />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Super Admin</h1>
        <p className="text-gray-500">Manage businesses, plans, and subscriptions</p>
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
      </div>

      {loading ? (
        <div className="card p-12 text-center text-gray-500">Loading...</div>
      ) : tab === 'businesses' ? (
        <div className="card overflow-hidden">
          {businesses.length === 0 ? (
            <EmptyState icon={Building2} title="No businesses" subtitle="Registered businesses will appear here" />
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr className="text-left text-gray-500">
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Timezone</th>
                  <th className="px-6 py-3">Created</th>
                </tr>
              </thead>
              <tbody>
                {businesses.map((b) => (
                  <tr key={b._id} className="border-t border-gray-100 dark:border-gray-800">
                    <td className="px-6 py-4 font-medium">{b.name}</td>
                    <td className="px-6 py-4 capitalize">{b.type}</td>
                    <td className="px-6 py-4 text-gray-500">{b.email}</td>
                    <td className="px-6 py-4 text-gray-500">{b.timezone}</td>
                    <td className="px-6 py-4 text-gray-500">{new Date(b.createdAt).toLocaleDateString()}</td>
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
    </div>
  );
}
