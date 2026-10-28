import React, { useState } from 'react';
import { format, parseISO, isValid } from 'date-fns';
import { Reminder } from '../types';
import { ClockIcon, TrashIcon, ListTodoIcon, RotateCcwIcon } from './icons';
import LoadingSpinner from './LoadingSpinner';

interface ReminderCardProps {
  reminder: Reminder;
  onToggleEnabled?: (reminderId: number, currentEnabled: boolean) => Promise<void>;
  onDelete?: (reminder: Reminder) => void;
}

export const ReminderCard: React.FC<ReminderCardProps> = ({
  reminder,
  onToggleEnabled,
  onDelete,
}) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const formatDueTime = (dateStr: string) => {
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

  const handleToggle = async () => {
    if (isUpdating || !onToggleEnabled) return;
    setIsUpdating(true);
    try {
      await onToggleEnabled(reminder.id, reminder.enabled);
    } finally {
      setIsUpdating(false);
    }
  };

  const targetName =
    reminder.task_title ||
    reminder.routine_name ||
    (reminder.task_id ? `Task #${reminder.task_id}` : reminder.routine_id ? `Routine #${reminder.routine_id}` : 'General reminder');

  const isTaskTarget = !!reminder.task_id || !!reminder.task_title;

  return (
    <div
      className={`bg-white border rounded-lg p-4 transition-all ${
        reminder.enabled ? 'border-slate-200' : 'border-slate-200 bg-slate-50/50 opacity-75'
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div
            className={`p-2 rounded-md flex-shrink-0 ${
              isTaskTarget ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'
            }`}
          >
            {isTaskTarget ? <ListTodoIcon className="w-4 h-4" /> : <RotateCcwIcon className="w-4 h-4" />}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-900 truncate">
                {targetName}
              </span>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                {isTaskTarget ? 'Task' : 'Routine'}
              </span>
            </div>

            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-500">
              <ClockIcon className="w-3.5 h-3.5 text-slate-400" />
              <span>Due: {formatDueTime(reminder.due_at)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Enabled Toggle Switch */}
          {onToggleEnabled && (
            <button
              type="button"
              role="switch"
              aria-checked={reminder.enabled}
              disabled={isUpdating}
              onClick={handleToggle}
              className={`relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden disabled:opacity-50 ${
                reminder.enabled ? 'bg-indigo-600' : 'bg-slate-300'
              }`}
              title={reminder.enabled ? 'Disable reminder' : 'Enable reminder'}
            >
              {isUpdating ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <LoadingSpinner size="sm" />
                </div>
              ) : (
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    reminder.enabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              )}
            </button>
          )}

          {/* Delete reminder */}
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(reminder)}
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
              title="Delete reminder"
              aria-label="Delete reminder"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReminderCard;
