import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../lib/api';
import { DailyMissions, Task, RoutineOccurrence, CreateTaskInput } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';
import TaskCard from '../../components/TaskCard';
import QuickAddTask from '../../components/QuickAddTask';
import EmptyState from '../../components/EmptyState';
import ConfirmDialog from '../../components/ConfirmDialog';
import CreateTaskModal from '../tasks/CreateTaskModal';
import EditTaskModal from '../tasks/EditTaskModal';
import {
  LightbulbIcon,
  CheckCircleIcon,
  ClockIcon,
  RotateCcwIcon,
  PlusIcon,
  CheckIcon,
} from '../../components/icons';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [missions, setMissions] = useState<DailyMissions | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Routine toggling loading tracker
  const [togglingRoutineId, setTogglingRoutineId] = useState<number | null>(null);

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const formattedTodayDate = format(new Date(), 'EEEE, MMMM d, yyyy');

  // Greeting helper: 5-11=morning, 12-16=afternoon, 17-20=evening, else=night
  const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour <= 11) return 'Good morning';
    if (hour >= 12 && hour <= 16) return 'Good afternoon';
    if (hour >= 17 && hour <= 20) return 'Good evening';
    return 'Good night';
  };

  const fetchDailyMissions = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get<DailyMissions>('/api/daily-missions', {
        params: { date: todayStr },
      });
      setMissions(response.data);
    } catch {
      // In case /api/daily-missions?date returns an error or is empty
      // Fallback: try fetching tasks with deadline or today's tasks
      try {
        const tasksRes = await api.get<Task[]>('/api/tasks');
        const tasks = tasksRes.data || [];
        const todayTasks = tasks.filter((t) => {
          if (!t.deadline) return true;
          return t.deadline.slice(0, 10) === todayStr;
        });

        // Also try fetching routines
        let routineOccs: RoutineOccurrence[] = [];
        try {
          const routinesRes = await api.get('/api/routines');
          if (Array.isArray(routinesRes.data)) {
            routineOccs = routinesRes.data.map((r) => ({
              routine_id: r.id,
              routine_name: r.name,
              occurrence_date: todayStr,
              completed: !!r.today_completed,
            }));
          }
        } catch {
          // ignore routine fallback error
        }

        const completedCount =
          todayTasks.filter((t) => t.status === 'completed').length +
          routineOccs.filter((r) => r.completed).length;

        setMissions({
          date: todayStr,
          tasks: todayTasks,
          routine_occurrences: routineOccs,
          summary: {
            total: todayTasks.length + routineOccs.length,
            completed: completedCount,
          },
        });
      } catch {
        toast.error('Could not load daily missions');
      }
    } finally {
      setIsLoading(false);
    }
  }, [todayStr]);

  useEffect(() => {
    fetchDailyMissions();
  }, [fetchDailyMissions]);

  // Task actions
  const handleCompleteTask = async (taskId: number) => {
    try {
      await api.patch(`/api/tasks/${taskId}/complete`);
      toast.success('Task completed!');
      fetchDailyMissions();
    } catch {
      try {
        await api.patch(`/api/tasks/${taskId}`, { status: 'completed' });
        toast.success('Task completed!');
        fetchDailyMissions();
      } catch {
        toast.error('Failed to complete task');
      }
    }
  };

  const handleReopenTask = async (taskId: number) => {
    try {
      await api.patch(`/api/tasks/${taskId}/reopen`);
      toast.success('Task reopened');
      fetchDailyMissions();
    } catch {
      try {
        await api.patch(`/api/tasks/${taskId}`, { status: 'pending' });
        toast.success('Task reopened');
        fetchDailyMissions();
      } catch {
        toast.error('Failed to reopen task');
      }
    }
  };

  const handleQuickAddTask = async (input: CreateTaskInput) => {
    try {
      await api.post<Task>('/api/tasks', input);
      toast.success('Task added to today!');
      await fetchDailyMissions();
      return true;
    } catch {
      toast.error('Failed to add task');
      return false;
    }
  };

  const handleDeleteTaskConfirm = async () => {
    if (!deletingTask) return;
    setIsDeleting(true);
    try {
      await api.delete(`/api/tasks/${deletingTask.id}`);
      toast.success('Task deleted');
      setDeletingTask(null);
      fetchDailyMissions();
    } catch {
      toast.error('Failed to delete task');
    } finally {
      setIsDeleting(false);
    }
  };

  // Routine occurrence toggle
  const handleToggleRoutineOccurrence = async (routineId: number, currentlyCompleted: boolean) => {
    setTogglingRoutineId(routineId);
    try {
      await api.put(`/api/routines/${routineId}/completions/${todayStr}`, {
        completed: !currentlyCompleted,
      });
      toast.success(!currentlyCompleted ? 'Routine completed!' : 'Routine reset');
      fetchDailyMissions();
    } catch {
      toast.error('Failed to update routine occurrence');
    } finally {
      setTogglingRoutineId(null);
    }
  };

  // Calculations
  const tasks = missions?.tasks || [];
  const routines = missions?.routine_occurrences || [];
  const pendingTasks = tasks.filter((t) => t.status !== 'completed');
  const completedTasks = tasks.filter((t) => t.status === 'completed');
  const completedRoutines = routines.filter((r) => r.completed);

  const totalItems = tasks.length + routines.length;
  const completedItems = completedTasks.length + completedRoutines.length;
  const pendingItems = totalItems - completedItems;

  return (
    <div className="space-y-6">
      {/* Top Banner: Greeting, Date, Focus support trigger */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {getGreeting()}, {user?.name || 'Friend'}
          </h1>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
            <span>{formattedTodayDate}</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => navigate('/focus')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-md bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 transition-colors shadow-2xs"
            title="Get instant next-step suggestion if you're feeling stuck or overwhelmed"
          >
            <LightbulbIcon className="w-4 h-4 text-amber-600" />
            <span>I'm stuck — get a suggestion</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-md bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-2xs"
          >
            <PlusIcon className="w-4 h-4" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600">
            <ClockIcon className="w-5 h-5" />
          </div>
          <div>
            <span className="text-2xl font-bold text-slate-900">{pendingItems}</span>
            <p className="text-xs font-medium text-slate-500">Pending Today</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600">
            <CheckCircleIcon className="w-5 h-5" />
          </div>
          <div>
            <span className="text-2xl font-bold text-slate-900">{completedItems}</span>
            <p className="text-xs font-medium text-slate-500">Completed Today</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600">
            <RotateCcwIcon className="w-5 h-5" />
          </div>
          <div>
            <span className="text-2xl font-bold text-slate-900">
              {completedRoutines.length} / {routines.length}
            </span>
            <p className="text-xs font-medium text-slate-500">Daily Routines</p>
          </div>
        </div>
      </div>

      {/* Quick Add Form */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
          Quick Add Task for Today
        </label>
        <QuickAddTask onAddTask={handleQuickAddTask} />
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="py-16">
          <LoadingSpinner size="lg" label="Loading today's missions..." />
        </div>
      ) : totalItems === 0 ? (
        /* Empty State */
        <EmptyState
          icon={<CheckCircleIcon className="w-6 h-6" />}
          title="No daily missions scheduled for today"
          description="Enjoy your clear slate, or schedule a few small, meaningful tasks to build momentum."
          actionLabel="Create a Task"
          onAction={() => setIsCreateModalOpen(true)}
        />
      ) : (
        <div className="space-y-6">
          {/* Daily Routines Section */}
          {routines.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <RotateCcwIcon className="w-4 h-4 text-indigo-600" />
                  Today's Routines ({completedRoutines.length}/{routines.length})
                </h2>
                <Link
                  to="/routines"
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
                >
                  Manage routines →
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {routines.map((occ) => {
                  const isUpdating = togglingRoutineId === occ.routine_id;
                  return (
                    <div
                      key={occ.routine_id}
                      className={`flex items-center justify-between p-3.5 bg-white border rounded-lg transition-all ${
                        occ.completed
                          ? 'border-emerald-200 bg-emerald-50/20'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() =>
                            handleToggleRoutineOccurrence(occ.routine_id, occ.completed)
                          }
                          className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors flex-shrink-0 ${
                            occ.completed
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'border-slate-300 hover:border-indigo-600 bg-white'
                          }`}
                          title={occ.completed ? 'Mark incomplete' : 'Mark complete'}
                        >
                          {isUpdating ? (
                            <LoadingSpinner size="sm" />
                          ) : occ.completed ? (
                            <CheckIcon className="w-3.5 h-3.5" />
                          ) : null}
                        </button>
                        <span
                          className={`text-sm font-medium truncate ${
                            occ.completed ? 'line-through text-slate-400' : 'text-slate-800'
                          }`}
                        >
                          {occ.routine_name}
                        </span>
                      </div>

                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                          occ.completed
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {occ.completed ? 'Completed' : 'Pending'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Pending Tasks Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <ClockIcon className="w-4 h-4 text-indigo-600" />
                Tasks to Do ({pendingTasks.length})
              </h2>
              <Link
                to="/tasks"
                className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
              >
                View all tasks →
              </Link>
            </div>

            {pendingTasks.length === 0 ? (
              <div className="p-6 bg-white border border-slate-200 rounded-lg text-center">
                <p className="text-xs font-medium text-slate-500">
                  All pending tasks for today are completed! Great work.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {pendingTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onComplete={handleCompleteTask}
                    onReopen={handleReopenTask}
                    onEdit={(t) => setEditingTask(t)}
                    onDelete={(t) => setDeletingTask(t)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Completed Tasks Section */}
          {completedTasks.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
                Completed Today ({completedTasks.length})
              </h2>
              <div className="space-y-2.5 opacity-80">
                {completedTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onComplete={handleCompleteTask}
                    onReopen={handleReopenTask}
                    onEdit={(t) => setEditingTask(t)}
                    onDelete={(t) => setDeletingTask(t)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onTaskCreated={() => fetchDailyMissions()}
      />

      <EditTaskModal
        isOpen={!!editingTask}
        task={editingTask}
        onClose={() => setEditingTask(null)}
        onTaskUpdated={() => fetchDailyMissions()}
      />

      <ConfirmDialog
        isOpen={!!deletingTask}
        title="Delete Task"
        message={`Are you sure you want to delete "${deletingTask?.title}"? This action cannot be undone.`}
        confirmLabel="Delete Task"
        isLoading={isDeleting}
        onClose={() => setDeletingTask(null)}
        onConfirm={handleDeleteTaskConfirm}
      />
    </div>
  );
};

export default DashboardPage;
