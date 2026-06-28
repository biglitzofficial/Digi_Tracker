import { useEffect, useState } from 'react';
import { Plus, Search, MoreVertical, UserCheck, UserX } from 'lucide-react';
import toast from 'react-hot-toast';
import { userAPI } from '../services/api';

export default function Staff() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '', phone: '' });

  const loadStaff = async () => {
    try {
      const { data } = await userAPI.list({ search, isActive: true });
      setStaff(data.data);
    } catch (err) {
      toast.error('Failed to load staff');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadStaff(); }, [search]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      if (editUser) {
        const payload = { firstName: form.firstName, lastName: form.lastName, phone: form.phone };
        if (form.password) payload.password = form.password;
        await userAPI.update(editUser._id, payload);
        toast.success('Staff updated');
      } else {
        await userAPI.create(form);
        toast.success('Staff member added');
      }
      setShowModal(false);
      setEditUser(null);
      setForm({ email: '', password: '', firstName: '', lastName: '', phone: '' });
      loadStaff();
    } catch (err) {
      const details = err.response?.data?.errors?.map((e) => e.message).join(', ');
      toast.error(details || err.response?.data?.message || 'Failed to save staff');
    }
  };

  const openEdit = (user) => {
    setEditUser(user);
    setForm({
      email: user.email,
      password: '',
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone || '',
    });
    setShowModal(true);
  };

  const handleDeactivate = async (id) => {
    if (!confirm('Deactivate this staff member?')) return;
    try {
      await userAPI.delete(id);
      toast.success('Staff deactivated');
      loadStaff();
    } catch (err) {
      toast.error('Failed to deactivate');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Staff Management</h1>
          <p className="text-gray-500">Manage your team members</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => { setEditUser(null); setForm({ email: '', password: '', firstName: '', lastName: '', phone: '' }); setShowModal(true); }}>
          <Plus className="w-4 h-4" /> Add Staff
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input className="input pl-9" placeholder="Search staff..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800/50">
            <tr className="text-left text-gray-500">
              <th className="px-6 py-3 font-medium">Name</th>
              <th className="px-6 py-3 font-medium">Email</th>
              <th className="px-6 py-3 font-medium">Role</th>
              <th className="px-6 py-3 font-medium">Points</th>
              <th className="px-6 py-3 font-medium">Streak</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">Loading...</td></tr>
            ) : staff.map((s) => (
              <tr key={s._id} className="border-t border-gray-100 dark:border-gray-800">
                <td className="px-6 py-4 font-medium">{s.firstName} {s.lastName}</td>
                <td className="px-6 py-4 text-gray-500">{s.email}</td>
                <td className="px-6 py-4 capitalize">{s.role?.replace('_', ' ')}</td>
                <td className="px-6 py-4">{s.rewardPoints || 0}</td>
                <td className="px-6 py-4">🔥 {s.currentStreak || 0}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${s.isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700'}`}>
                    {s.isActive ? <><UserCheck className="w-3 h-3" /> Active</> : <><UserX className="w-3 h-3" /> Inactive</>}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {s.role !== 'business_owner' && (
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(s)} className="text-primary-600 hover:text-primary-700 text-xs font-medium">
                        Edit
                      </button>
                      <button onClick={() => handleDeactivate(s._id)} className="text-red-500 hover:text-red-700 text-xs font-medium">
                        Deactivate
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">{editUser ? 'Edit Staff Member' : 'Add Staff Member'}</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">First Name</label>
                  <input className="input mt-1" required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium">Last Name</label>
                  <input className="input mt-1" required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
                </div>
              </div>
              {!editUser && (
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <input type="email" className="input mt-1" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
              )}
              <div>
                <label className="text-sm font-medium">{editUser ? 'New Password (optional)' : 'Password'}</label>
                <input type="password" className="input mt-1" required={!editUser} minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">Phone</label>
                <input className="input mt-1" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" className="btn-secondary flex-1" onClick={() => { setShowModal(false); setEditUser(null); }}>Cancel</button>
                <button type="submit" className="btn-primary flex-1">{editUser ? 'Save' : 'Add Staff'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
