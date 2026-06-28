import { useEffect, useState } from 'react';
import { Building2, ChevronDown } from 'lucide-react';
import { businessAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export function getActiveBusinessId() {
  return localStorage.getItem('activeBusinessId');
}

export function setActiveBusinessId(id) {
  if (id) localStorage.setItem('activeBusinessId', id);
  else localStorage.removeItem('activeBusinessId');
}

export default function BusinessSwitcher() {
  const { user } = useAuth();
  const [businesses, setBusinesses] = useState([]);
  const [activeId, setActiveId] = useState(getActiveBusinessId());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== 'super_admin') return;

    businessAPI.list()
      .then((res) => {
        const list = res.data.data || [];
        setBusinesses(list);
        const stored = getActiveBusinessId();
        if (stored && list.some((b) => b._id === stored)) {
          setActiveId(stored);
        } else if (list.length) {
          setActiveBusinessId(list[0]._id);
          setActiveId(list[0]._id);
        }
      })
      .finally(() => setLoading(false));
  }, [user?.role]);

  if (user?.role !== 'super_admin') return null;

  const active = businesses.find((b) => b._id === activeId);

  const handleChange = (e) => {
    const id = e.target.value;
    setActiveBusinessId(id);
    setActiveId(id);
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="hidden md:flex items-center gap-2 px-3 py-1.5 text-sm text-gray-400">
        <Building2 className="w-4 h-4" /> Loading...
      </div>
    );
  }

  if (!businesses.length) {
    return (
      <div className="hidden md:flex items-center gap-2 px-3 py-1.5 text-sm text-amber-600 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
        <Building2 className="w-4 h-4" /> No businesses yet
      </div>
    );
  }

  return (
    <div className="relative hidden md:block min-w-[180px] max-w-[240px]">
      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-500 pointer-events-none" />
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      <select
        className="input pl-9 pr-8 py-1.5 text-sm font-medium appearance-none cursor-pointer"
        value={activeId || ''}
        onChange={handleChange}
        title="Switch business"
      >
        {businesses.map((b) => (
          <option key={b._id} value={b._id}>{b.name}</option>
        ))}
      </select>
      {active && (
        <p className="text-[10px] text-gray-400 mt-0.5 truncate px-1">Managing: {active.name}</p>
      )}
    </div>
  );
}
