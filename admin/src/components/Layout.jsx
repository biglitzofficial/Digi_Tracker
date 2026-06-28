import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Package, BarChart3, Trophy,
  FileText, Settings, LogOut, Moon, Sun, Menu, X, TrendingUp,
  ClipboardList, Shield, CalendarCheck,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import GlobalSearch from './GlobalSearch';
import BusinessSwitcher from './BusinessSwitcher';
import { canManageBusiness } from '../utils/permissions';

const ownerNavItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/staff', icon: Users, label: 'Staff' },
  { to: '/modules', icon: Package, label: 'Modules' },
  { to: '/entries', icon: ClipboardList, label: 'Entries' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/rewards', icon: Trophy, label: 'Rewards' },
  { to: '/reports', icon: FileText, label: 'Reports' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

const staffNavItems = [
  { to: '/', icon: CalendarCheck, label: 'Today' },
  { to: '/entries', icon: ClipboardList, label: 'My Entries' },
  { to: '/rewards', icon: Trophy, label: 'Rewards' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isManager = canManageBusiness(user);
  let navItems = isManager ? ownerNavItems : staffNavItems;

  if (user?.role === 'super_admin') {
    navItems = [
      ...ownerNavItems.slice(0, -1),
      { to: '/super-admin', icon: Shield, label: 'Super Admin' },
      ownerNavItems[ownerNavItems.length - 1],
    ];
  }

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transform transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center gap-2 px-6 py-5 border-b border-gray-200 dark:border-gray-800">
          <TrendingUp className="w-8 h-8 text-primary-600" />
          <div>
            <h1 className="font-bold text-lg">DigiTracker</h1>
            <p className="text-xs text-gray-500">{isManager ? 'Growth Platform' : 'Staff Portal'}</p>
          </div>
          <button className="ml-auto lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-140px)]">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <Icon className="w-5 h-5" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-800">
          <button onClick={handleLogout} className="sidebar-link w-full text-red-600 dark:text-red-400">
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 sm:px-6 gap-4">
          <button className="lg:hidden shrink-0" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-6 h-6" />
          </button>
          {isManager && <GlobalSearch />}
          {user?.role === 'super_admin' && <BusinessSwitcher />}
          {!isManager && user?.role !== 'super_admin' && <div className="flex-1" />}
          {isManager && user?.role !== 'super_admin' && <div className="flex-1" />}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <button onClick={toggle} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
              {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-700 dark:text-primary-300 font-medium text-sm">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role?.replace('_', ' ')}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
