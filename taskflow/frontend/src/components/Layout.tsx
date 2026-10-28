import React, { useState } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import { MenuIcon, HomeIcon, ListTodoIcon, RotateCcwIcon, BellIcon, TargetIcon } from './icons';

export const Layout: React.FC = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const location = useLocation();

  const getPageTitle = (path: string): string => {
    if (path === '/') return 'Today';
    if (path.startsWith('/goals')) return 'Goals';
    if (path.startsWith('/tasks')) return 'Tasks';
    if (path.startsWith('/routines')) return 'Routines';
    if (path.startsWith('/reminders')) return 'Reminders & Notifications';
    if (path.startsWith('/progress')) return 'Progress';
    if (path.startsWith('/focus')) return 'Focus Support';
    if (path.startsWith('/profile')) return 'Profile';
    return 'Taskflow';
  };

  const mobileBottomItems = [
    { label: 'Today', path: '/', icon: HomeIcon },
    { label: 'Tasks', path: '/tasks', icon: ListTodoIcon },
    { label: 'Goals', path: '/goals', icon: TargetIcon },
    { label: 'Routines', path: '/routines', icon: RotateCcwIcon },
    { label: 'Reminders', path: '/reminders', icon: BellIcon },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Sidebar for Desktop & Mobile drawer */}
      <Sidebar
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between px-4 h-14 bg-white border-b border-slate-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md"
              aria-label="Open navigation menu"
            >
              <MenuIcon className="w-5 h-5" />
            </button>
            <h1 className="text-base font-semibold text-slate-800">
              {getPageTitle(location.pathname)}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/focus"
              className="px-2.5 py-1 text-xs font-medium rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200"
            >
              Focus
            </Link>
          </div>
        </header>

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8 pb-20 md:pb-8">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>

        {/* Mobile Bottom Navigation Bar (≤768px) */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 flex items-center justify-around h-14 z-30 px-2 shadow-lg">
          {mobileBottomItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-medium transition-colors ${
                  isActive ? 'text-indigo-600 font-semibold' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span className="mt-0.5">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default Layout;
