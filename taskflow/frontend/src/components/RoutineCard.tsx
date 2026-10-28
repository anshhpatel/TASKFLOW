import React, { useState } from 'react';
import { Routine } from '../types';
import { CheckIcon, RotateCcwIcon, EditIcon, TrashIcon, CalendarIcon } from './icons';
import LoadingSpinner from './LoadingSpinner';

interface RoutineCardProps {
  routine: Routine;
  onToggleComplete?: (routineId: number, currentlyCompleted: boolean) => Promise<void>;
  onEdit?: (routine: Routine) => void;
  onDelete?: (routine: Routine) => void;
}

export const RoutineCard: React.FC<RoutineCardProps> = ({
  routine,
  onToggleComplete,
  onEdit,
  onDelete,
}) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const isCompletedToday = !!routine.today_completed;

  const handleToggle = async () => {
    if (isUpdating || !onToggleComplete) return;
    setIsUpdating(true);
    try {
      await onToggleComplete(routine.id, isCompletedToday);
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDays = (daysStr: string) => {
    if (!daysStr) return 'No days set';
    // If it's already comma-separated names like "Mon, Wed, Fri"
    if (daysStr.includes('Mon') || daysStr.includes('Tue') || daysStr.includes('Wed')) {
      return daysStr;
    }
    // If it's indices "1,2,3,4,5" (0=Sun, 1=Mon... or 1=Mon...7=Sun)
    const dayMap: Record<string, string> = {
      '0': 'Sun',
      '1': 'Mon',
      '2': 'Tue',
      '3': 'Wed',
      '4': 'Thu',
      '5': 'Fri',
      '6': 'Sat',
      '7': 'Sun',
    };
    const parts = daysStr.split(',').map((d) => d.trim());
    if (parts.length === 7) return 'Every day';
    if (parts.length === 5 && !parts.includes('0') && !parts.includes('6') && !parts.includes('7')) {
      return 'Weekdays (Mon-Fri)';
    }
    const mapped = parts.map((p) => dayMap[p] || p);
    return mapped.join(', ');
  };

  return (
    <div
      className={`bg-white border rounded-lg p-4 transition-all duration-150 ${
        isCompletedToday
          ? 'border-emerald-200 bg-emerald-50/20'
          : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Toggle completion button */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {onToggleComplete && (
            <button
              type="button"
              onClick={handleToggle}
              disabled={isUpdating}
              className={`mt-0.5 w-6 h-6 rounded-md border flex items-center justify-center transition-colors flex-shrink-0 ${
                isCompletedToday
                  ? 'bg-emerald-600 border-emerald-600 text-white'
                  : 'border-slate-300 hover:border-indigo-600 bg-white text-transparent'
              }`}
              title={isCompletedToday ? "Mark today's routine incomplete" : "Mark today's routine complete"}
              aria-label={isCompletedToday ? "Mark today's routine incomplete" : "Mark today's routine complete"}
            >
              {isUpdating ? (
                <LoadingSpinner size="sm" />
              ) : isCompletedToday ? (
                <CheckIcon className="w-4 h-4" />
              ) : (
                <CheckIcon className="w-4 h-4 text-slate-300 hover:text-slate-400" />
              )}
            </button>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold text-slate-900 break-words">
                {routine.name}
              </span>
              <span
                className={`text-[10px] font-medium px-2 py-0.5 rounded border ${
                  isCompletedToday
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                {isCompletedToday ? "Done today" : "Pending today"}
              </span>
            </div>

            {routine.description && (
              <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                {routine.description}
              </p>
            )}

            <div className="flex items-center gap-1.5 mt-2.5 text-xs text-slate-500">
              <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
              <span>Schedule: <span className="font-medium text-slate-700">{formatDays(routine.schedule_days)}</span></span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {onToggleComplete && isCompletedToday && (
            <button
              type="button"
              onClick={handleToggle}
              disabled={isUpdating}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
              title="Reset today's completion"
              aria-label="Reset today's completion"
            >
              <RotateCcwIcon className="w-4 h-4" />
            </button>
          )}
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(routine)}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
              title="Edit routine"
              aria-label="Edit routine"
            >
              <EditIcon className="w-4 h-4" />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(routine)}
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
              title="Delete routine"
              aria-label="Delete routine"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoutineCard;
