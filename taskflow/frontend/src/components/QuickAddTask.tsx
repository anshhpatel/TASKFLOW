import React, { useState } from 'react';
import { CreateTaskInput } from '../types';
import { PlusIcon } from './icons';
import LoadingSpinner from './LoadingSpinner';

interface QuickAddTaskProps {
  onAddTask: (input: CreateTaskInput) => Promise<boolean | unknown>;
  defaultGoalId?: number;
  placeholder?: string;
}

export const QuickAddTask: React.FC<QuickAddTaskProps> = ({
  onAddTask,
  defaultGoalId,
  placeholder = 'Add a quick task for today...',
}) => {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Task title is required');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      const todayIso = new Date().toISOString();
      const success = await onAddTask({
        title: trimmedTitle,
        priority,
        deadline: todayIso,
        goal_id: defaultGoalId,
      });

      if (success) {
        setTitle('');
        setPriority('medium');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-slate-200 rounded-lg p-3 shadow-2xs transition-all focus-within:border-indigo-400 focus-within:ring-1 focus-within:ring-indigo-400"
    >
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="flex-1 min-w-0">
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (error) setError(null);
            }}
            placeholder={placeholder}
            disabled={isSubmitting}
            className="w-full text-sm text-slate-900 placeholder-slate-400 bg-transparent border-0 focus:outline-hidden focus:ring-0 px-2 py-1.5"
          />
        </div>

        <div className="flex items-center gap-2 justify-end flex-shrink-0">
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
            disabled={isSubmitting}
            className="text-xs bg-slate-50 border border-slate-200 text-slate-700 rounded-md px-2 py-1.5 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            title="Task priority"
          >
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
          </select>

          <button
            type="submit"
            disabled={isSubmitting || !title.trim()}
            className="inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md bg-indigo-600 hover:bg-indigo-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs"
          >
            {isSubmitting ? (
              <LoadingSpinner size="sm" />
            ) : (
              <PlusIcon className="w-3.5 h-3.5" />
            )}
            <span>Add</span>
          </button>
        </div>
      </div>

      {error && <p className="mt-1.5 px-2 text-xs text-red-600">{error}</p>}
    </form>
  );
};

export default QuickAddTask;
