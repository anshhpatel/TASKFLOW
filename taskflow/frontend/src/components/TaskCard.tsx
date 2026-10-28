import React, { useState } from 'react';
import { format, parseISO, isValid } from 'date-fns';
import { Task } from '../types';
import PriorityBadge from './PriorityBadge';
import StatusBadge from './StatusBadge';
import { CalendarIcon, ClockIcon, EditIcon, TrashIcon, CheckIcon, RotateCcwIcon } from './icons';
import LoadingSpinner from './LoadingSpinner';

interface TaskCardProps {
  task: Task;
  onComplete?: (taskId: number) => Promise<boolean | void>;
  onReopen?: (taskId: number) => Promise<boolean | void>;
  onEdit?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  showActions?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onComplete,
  onReopen,
  onEdit,
  onDelete,
  showActions = true,
}) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const isCompleted = task.status === 'completed';

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return null;
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

  const handleToggleComplete = async () => {
    if (isUpdating) return;
    setIsUpdating(true);
    try {
      if (isCompleted && onReopen) {
        await onReopen(task.id);
      } else if (!isCompleted && onComplete) {
        await onComplete(task.id);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div
      className={`bg-white border border-slate-200 rounded-lg p-4 transition-all duration-150 hover:border-slate-300 ${
        isCompleted ? 'bg-slate-50/60' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Toggle complete button */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {showActions && (onComplete || onReopen) && (
            <button
              type="button"
              onClick={handleToggleComplete}
              disabled={isUpdating}
              className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-colors flex-shrink-0 ${
                isCompleted
                  ? 'bg-emerald-600 border-emerald-600 text-white'
                  : 'border-slate-300 hover:border-indigo-600 bg-white'
              }`}
              title={isCompleted ? 'Mark pending' : 'Mark completed'}
              aria-label={isCompleted ? 'Mark pending' : 'Mark completed'}
            >
              {isUpdating ? (
                <LoadingSpinner size="sm" />
              ) : isCompleted ? (
                <CheckIcon className="w-3.5 h-3.5" />
              ) : null}
            </button>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span
                className={`text-sm font-semibold text-slate-900 break-words ${
                  isCompleted ? 'line-through text-slate-400' : ''
                }`}
              >
                {task.title}
              </span>
              <PriorityBadge priority={task.priority} />
              <StatusBadge status={task.status} />
            </div>

            {task.description && (
              <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                {task.description}
              </p>
            )}

            {/* Meta info: deadline / schedule */}
            <div className="flex flex-wrap items-center gap-4 mt-2.5 text-xs text-slate-500">
              {task.deadline && (
                <div className="flex items-center gap-1.5" title="Deadline">
                  <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                  <span>Due: {formatDateTime(task.deadline)}</span>
                </div>
              )}

              {task.scheduled_start && (
                <div className="flex items-center gap-1.5" title="Scheduled start">
                  <ClockIcon className="w-3.5 h-3.5 text-slate-400" />
                  <span>Starts: {formatDateTime(task.scheduled_start)}</span>
                </div>
              )}

              {task.completed_at && (
                <div className="flex items-center gap-1.5 text-emerald-600" title="Completed time">
                  <CheckIcon className="w-3.5 h-3.5" />
                  <span>Completed: {formatDateTime(task.completed_at)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action icons */}
        {showActions && (
          <div className="flex items-center gap-1 flex-shrink-0">
            {isCompleted && onReopen && (
              <button
                type="button"
                onClick={handleToggleComplete}
                disabled={isUpdating}
                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-md transition-colors"
                title="Reopen task"
                aria-label="Reopen task"
              >
                <RotateCcwIcon className="w-4 h-4" />
              </button>
            )}

            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(task)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                title="Edit task"
                aria-label="Edit task"
              >
                <EditIcon className="w-4 h-4" />
              </button>
            )}

            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(task)}
                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                title="Delete task"
                aria-label="Delete task"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskCard;
