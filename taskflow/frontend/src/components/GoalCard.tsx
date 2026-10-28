import React from 'react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO, isValid } from 'date-fns';
import { Goal } from '../types';
import StatusBadge from './StatusBadge';
import { CalendarIcon, ChevronRightIcon } from './icons';

interface GoalCardProps {
  goal: Goal;
}

export const GoalCard: React.FC<GoalCardProps> = ({ goal }) => {
  const navigate = useNavigate();

  const totalTasks = goal.task_count ?? goal.tasks?.length ?? 0;
  const completedTasks =
    goal.completed_task_count ??
    goal.tasks?.filter((t) => t.status === 'completed').length ??
    0;

  const percentage =
    totalTasks > 0 ? Math.min(100, Math.round((completedTasks / totalTasks) * 100)) : 0;

  const formatTargetDate = (dateStr?: string) => {
    if (!dateStr) return null;
    try {
      const parsed = parseISO(dateStr);
      if (isValid(parsed)) {
        return format(parsed, 'MMM d, yyyy');
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  return (
    <div
      onClick={() => navigate(`/goals/${goal.id}`)}
      className="bg-white border border-slate-200 rounded-lg p-5 hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between"
    >
      <div>
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="text-base font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
            {goal.title}
          </h3>
          <StatusBadge status={goal.status} />
        </div>

        {goal.description && (
          <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">
            {goal.description}
          </p>
        )}
      </div>

      <div className="mt-4 space-y-3 pt-3 border-t border-slate-100">
        {/* Progress Bar */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-medium text-slate-700">Progress</span>
            <span className="text-slate-500">
              {completedTasks} / {totalTasks} tasks ({percentage}%)
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                percentage === 100 ? 'bg-emerald-500' : 'bg-indigo-600'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* Target Date & Arrow */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          {goal.target_date ? (
            <div className="flex items-center gap-1.5">
              <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
              <span>Target: {formatTargetDate(goal.target_date)}</span>
            </div>
          ) : (
            <span className="text-slate-400">No deadline set</span>
          )}

          <span className="inline-flex items-center text-xs font-medium text-indigo-600 group-hover:translate-x-0.5 transition-transform">
            View goal <ChevronRightIcon className="w-4 h-4 ml-0.5" />
          </span>
        </div>
      </div>
    </div>
  );
};

export default GoalCard;
