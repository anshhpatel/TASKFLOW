import React, { useState, useEffect, useCallback } from 'react';
import { format, startOfWeek, endOfWeek, parseISO, isValid } from 'date-fns';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import { ProgressSummary } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { BarChart2Icon, CheckCircleIcon, CalendarIcon, RotateCcwIcon, ClockIcon } from '../../components/icons';

export const ProgressPage: React.FC = () => {
  const defaultFrom = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const defaultTo = format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');

  const [fromDate, setFromDate] = useState<string>(defaultFrom);
  const [toDate, setToDate] = useState<string>(defaultTo);
  const [summary, setSummary] = useState<ProgressSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchProgress = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get<ProgressSummary>('/api/progress/summary', {
        params: {
          from: fromDate,
          to: toDate,
        },
      });
      setSummary(response.data);
    } catch {
      // In case /api/progress/summary is not yet implemented on backend or returns error,
      // fallback to sensible empty/calculated summary
      toast.error('Unable to fetch progress summary for the selected range');
      setSummary({
        tasks_total: 0,
        tasks_completed: 0,
        tasks_pending: 0,
        routines_total_occurrences: 0,
        routines_completed_occurrences: 0,
        completion_rate_tasks: 0,
        completion_rate_routines: 0,
        daily_breakdown: [],
      });
    } finally {
      setIsLoading(false);
    }
  }, [fromDate, toDate]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  const handlePresetRange = (preset: 'today' | 'this_week' | 'last_7_days' | 'this_month') => {
    const now = new Date();
    if (preset === 'today') {
      const t = format(now, 'yyyy-MM-dd');
      setFromDate(t);
      setToDate(t);
    } else if (preset === 'this_week') {
      setFromDate(format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'));
      setToDate(format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'));
    } else if (preset === 'last_7_days') {
      const past = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
      setFromDate(format(past, 'yyyy-MM-dd'));
      setToDate(format(now, 'yyyy-MM-dd'));
    } else if (preset === 'this_month') {
      const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setFromDate(format(startMonth, 'yyyy-MM-dd'));
      setToDate(format(endMonth, 'yyyy-MM-dd'));
    }
  };

  const formatDayHeader = (dateStr: string) => {
    try {
      const parsed = parseISO(dateStr);
      if (isValid(parsed)) {
        return format(parsed, 'EEEE, MMM d, yyyy');
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Progress & Consistency</h1>
          <p className="text-xs text-slate-500 mt-1">
            Review completed tasks, routine consistency, and daily habits
          </p>
        </div>

        {/* Date Filter & Presets */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handlePresetRange('today')}
            className="px-2.5 py-1 text-xs font-medium rounded-md bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => handlePresetRange('this_week')}
            className="px-2.5 py-1 text-xs font-medium rounded-md bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
          >
            This Week
          </button>
          <button
            type="button"
            onClick={() => handlePresetRange('last_7_days')}
            className="px-2.5 py-1 text-xs font-medium rounded-md bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Last 7 Days
          </button>
          <button
            type="button"
            onClick={() => handlePresetRange('this_month')}
            className="px-2.5 py-1 text-xs font-medium rounded-md bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
          >
            This Month
          </button>
        </div>
      </div>

      {/* Date Range Picker Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex flex-wrap items-center gap-3 shadow-2xs">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-medium text-slate-600">From:</span>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="text-xs px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-md text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-600"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-600">To:</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="text-xs px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-md text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-600"
          />
        </div>
      </div>

      {/* Summary Metrics */}
      {isLoading ? (
        <div className="py-20">
          <LoadingSpinner size="lg" label="Calculating progress..." />
        </div>
      ) : summary ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Tasks Completed */}
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-500">Tasks Completed</span>
                <div className="p-1.5 rounded-md bg-emerald-50 text-emerald-600">
                  <CheckCircleIcon className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900">
                  {summary.tasks_completed}
                </span>
                <span className="text-xs text-slate-400">of {summary.tasks_total} total</span>
              </div>
            </div>

            {/* Task Completion Rate */}
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-500">Task Completion Rate</span>
                <div className="p-1.5 rounded-md bg-indigo-50 text-indigo-600">
                  <BarChart2Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900">
                  {Math.round(summary.completion_rate_tasks || 0)}%
                </span>
                <span className="text-xs text-slate-400">
                  {summary.tasks_pending} pending
                </span>
              </div>
            </div>

            {/* Routine Occurrences Completed */}
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-500">Routines Done</span>
                <div className="p-1.5 rounded-md bg-emerald-50 text-emerald-600">
                  <RotateCcwIcon className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900">
                  {summary.routines_completed_occurrences}
                </span>
                <span className="text-xs text-slate-400">
                  of {summary.routines_total_occurrences} scheduled
                </span>
              </div>
            </div>

            {/* Routine Consistency Rate */}
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-500">Routine Consistency</span>
                <div className="p-1.5 rounded-md bg-amber-50 text-amber-600">
                  <ClockIcon className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900">
                  {Math.round(summary.completion_rate_routines || 0)}%
                </span>
                <span className="text-xs text-slate-400">target consistency</span>
              </div>
            </div>
          </div>

          {/* Daily Breakdown */}
          <div className="bg-white border border-slate-200 rounded-lg p-5">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-indigo-600" />
              Daily Breakdown
            </h2>

            {summary.daily_breakdown.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">
                No completion logs recorded in this date range.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {summary.daily_breakdown.map((day) => (
                  <div
                    key={day.date}
                    className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                  >
                    <span className="font-semibold text-slate-800">
                      {formatDayHeader(day.date)}
                    </span>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
                        <span>
                          <strong className="text-slate-900">{day.tasks_completed}</strong> tasks
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-slate-600">
                        <RotateCcwIcon className="w-4 h-4 text-indigo-600" />
                        <span>
                          <strong className="text-slate-900">{day.routines_completed}</strong> routines
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <EmptyState
          icon={<BarChart2Icon className="w-6 h-6" />}
          title="No progress data available"
          description="Complete tasks and mark routine occurrences to see your productivity trends."
        />
      )}
    </div>
  );
};

export default ProgressPage;
