import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO, isValid } from 'date-fns';
import { useAuth } from '../../hooks/useAuth';
import ConfirmDialog from '../../components/ConfirmDialog';
import { UserIcon, LogoutIcon, CalendarIcon } from '../../components/icons';

export const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const formatJoinedDate = (dateStr?: string) => {
    if (!dateStr) return 'Recently';
    try {
      const parsed = parseISO(dateStr);
      if (isValid(parsed)) {
        return format(parsed, 'MMMM d, yyyy');
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="pb-2 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">User Profile</h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage your account details and authentication session
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-2xl flex-shrink-0">
            {user?.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="w-8 h-8 text-indigo-500" />}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">{user?.name || 'Taskflow User'}</h2>
            <p className="text-sm text-slate-500">{user?.email || 'No email provided'}</p>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-4 space-y-3">
          <div className="flex items-center justify-between text-xs py-1">
            <span className="text-slate-500">Account ID</span>
            <span className="font-mono text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
              #{user?.id ?? '1'}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs py-1">
            <span className="text-slate-500">Member Since</span>
            <div className="flex items-center gap-1.5 text-slate-800">
              <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
              <span>{formatJoinedDate(user?.created_at)}</span>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-5">
          <button
            type="button"
            onClick={() => setIsLogoutConfirmOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-red-600 hover:bg-red-700 text-white transition-colors shadow-2xs"
          >
            <LogoutIcon className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={isLogoutConfirmOpen}
        title="Sign Out"
        message="Are you sure you want to sign out of your Taskflow account?"
        confirmLabel="Sign Out"
        isDestructive={false}
        onClose={() => setIsLogoutConfirmOpen(false)}
        onConfirm={handleLogout}
      />
    </div>
  );
};

export default ProfilePage;
