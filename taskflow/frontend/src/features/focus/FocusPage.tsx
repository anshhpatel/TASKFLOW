import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import { Task, FocusSuggestion } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';
import { LightbulbIcon, ArrowRightIcon, CheckCircleIcon, SparklesIcon } from '../../components/icons';

export const FocusPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [suggestion, setSuggestion] = useState<FocusSuggestion | null>(null);
  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);

  useEffect(() => {
    setIsLoadingTasks(true);
    api
      .get<Task[]>('/api/tasks', { params: { status: 'pending' } })
      .then((res) => setTasks(res.data || []))
      .catch(() => setTasks([]))
      .finally(() => setIsLoadingTasks(false));
  }, []);

  const handleGetSuggestion = async () => {
    setIsLoadingSuggestion(true);
    try {
      const payload: { task_id?: number } = {};
      if (selectedTaskId) {
        payload.task_id = Number(selectedTaskId);
      }

      const response = await api.post<FocusSuggestion>('/api/focus-support/suggestion', payload);
      setSuggestion(response.data);
    } catch {
      // Fallback deterministic supportive suggestions if backend is offline or static
      const fallbackSuggestions: FocusSuggestion[] = [
        {
          suggestion: 'Set a timer for 5 minutes and commit to working on only the very first step.',
          tip: 'Once momentum starts, continuing becomes significantly easier.',
          task_title: selectedTaskId
            ? tasks.find((t) => t.id === Number(selectedTaskId))?.title
            : undefined,
        },
        {
          suggestion: 'Write down what the definition of "done" is for the next 10 minutes.',
          tip: 'Ambiguity causes friction. Shrink the problem until it feels almost effortless to begin.',
          task_title: selectedTaskId
            ? tasks.find((t) => t.id === Number(selectedTaskId))?.title
            : undefined,
        },
        {
          suggestion: 'Clear your immediate workspace, drink a glass of water, and open the single file or tool you need.',
          tip: 'Reducing visual noise helps reset cognitive clarity.',
        },
      ];

      const picked =
        fallbackSuggestions[Math.floor(Math.random() * fallbackSuggestions.length)];
      setSuggestion(picked);
      toast('Focus suggestion ready', { icon: '💡' });
    } finally {
      setIsLoadingSuggestion(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-4">
      {/* Back link */}
      <div>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <span>← Back to Today</span>
        </Link>
      </div>

      {/* Main Focus Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-2xs">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
            <LightbulbIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">I'm feeling stuck</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Take a breath. Let's break the inertia and find one calm, simple next step.
            </p>
          </div>
        </div>

        {/* Task selector */}
        <div className="mt-6 space-y-4">
          <div>
            <label htmlFor="stuck-task" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Which task is giving you trouble? (Optional)
            </label>
            <select
              id="stuck-task"
              value={selectedTaskId}
              onChange={(e) => setSelectedTaskId(e.target.value)}
              disabled={isLoadingTasks || isLoadingSuggestion}
              className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 cursor-pointer"
            >
              <option value="">General stuck state / Any task</option>
              {tasks.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.title}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleGetSuggestion}
            disabled={isLoadingSuggestion}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-2xs disabled:opacity-50"
          >
            {isLoadingSuggestion ? (
              <LoadingSpinner size="sm" />
            ) : (
              <SparklesIcon className="w-4 h-4" />
            )}
            <span>Get Next-Step Suggestion</span>
          </button>
        </div>

        {/* Returned Suggestion Display */}
        {suggestion && (
          <div className="mt-8 pt-6 border-t border-slate-100 space-y-4 animate-fade-in">
            {suggestion.task_title && (
              <div className="flex items-center gap-2 text-xs font-medium text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-md">
                <span>Task focus:</span>
                <span className="font-semibold">{suggestion.task_title}</span>
              </div>
            )}

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
              <h2 className="text-xs uppercase font-bold text-slate-500 tracking-wider mb-2">
                Your Next Small Step
              </h2>
              <p className="text-base font-semibold text-slate-900 leading-relaxed">
                "{suggestion.suggestion}"
              </p>

              {suggestion.tip && (
                <div className="mt-4 pt-3 border-t border-slate-200 flex items-start gap-2.5">
                  <CheckCircleIcon className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-slate-600 leading-relaxed">
                    <strong className="text-slate-800">Mindset Tip:</strong> {suggestion.tip}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleGetSuggestion}
                disabled={isLoadingSuggestion}
                className="text-xs text-slate-500 hover:text-slate-800 font-medium underline"
              >
                Try another suggestion
              </button>

              <Link
                to="/"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-md bg-slate-900 hover:bg-slate-800 text-white transition-colors"
              >
                <span>Return to Today</span>
                <ArrowRightIcon className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FocusPage;
