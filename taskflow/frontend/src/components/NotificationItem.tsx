import React, { useState } from 'react';
import { format, parseISO, isValid } from 'date-fns';
import { Notification } from '../types';
import { CheckIcon, BellIcon } from './icons';
import LoadingSpinner from './LoadingSpinner';

interface NotificationItemProps {
  notification: Notification;
  onMarkRead?: (id: number) => Promise<void>;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkRead,
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const isRead = !!notification.read_at;

  const formatDate = (dateStr: string) => {
    try {
      const parsed = parseISO(dateStr);
      if (isValid(parsed)) {
        return format(parsed, 'MMM d, yyyy · h:mm a');
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  const handleMarkRead = async () => {
    if (isUpdating || isRead || !onMarkRead) return;
    setIsUpdating(true);
    try {
      await onMarkRead(notification.id);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div
      className={`p-4 rounded-lg border transition-all ${
        isRead
          ? 'bg-white border-slate-200 text-slate-600'
          : 'bg-indigo-50/30 border-indigo-100 shadow-2xs'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div
            className={`p-2 rounded-full flex-shrink-0 mt-0.5 ${
              isRead ? 'bg-slate-100 text-slate-400' : 'bg-indigo-100 text-indigo-600'
            }`}
          >
            <BellIcon className="w-4 h-4" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4
                className={`text-sm font-semibold truncate ${
                  isRead ? 'text-slate-800' : 'text-slate-900 font-bold'
                }`}
              >
                {notification.title}
              </h4>
              {!isRead && (
                <span className="w-2 h-2 rounded-full bg-indigo-600 flex-shrink-0" />
              )}
            </div>

            <p className="mt-1 text-xs text-slate-600 leading-relaxed break-words">
              {notification.body}
            </p>

            <span className="mt-2 block text-[11px] text-slate-400">
              {formatDate(notification.created_at)}
            </span>
          </div>
        </div>

        {!isRead && onMarkRead && (
          <button
            type="button"
            onClick={handleMarkRead}
            disabled={isUpdating}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 bg-white border border-indigo-200 hover:border-indigo-300 rounded-md transition-colors flex-shrink-0 shadow-2xs disabled:opacity-50"
            title="Mark as read"
          >
            {isUpdating ? (
              <LoadingSpinner size="sm" />
            ) : (
              <CheckIcon className="w-3.5 h-3.5" />
            )}
            <span>Mark read</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default NotificationItem;
