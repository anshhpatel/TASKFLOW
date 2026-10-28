import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { format, parseISO, isValid } from 'date-fns';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import { Goal, Task } from '../../types';
import StatusBadge from '../../components/StatusBadge';
import TaskCard from '../../components/TaskCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import ConfirmDialog from '../../components/ConfirmDialog';
import EditGoalModal from './EditGoalModal';
import CreateTaskModal from '../tasks/CreateTaskModal';
import EditTaskModal from '../tasks/EditTaskModal';
import {
  CalendarIcon,
  PlusIcon,
  EditIcon,
  TrashIcon,
  ChevronRightIcon,
  ListTodoIcon,
} from '../../components/icons';

export const GoalDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [goal, setGoal] = useState<Goal | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [isEditGoalOpen, setIsEditGoalOpen] = useState(false);
  const [isDeleteGoalOpen, setIsDeleteGoalOpen] = useState(false);
  const [isDeletingGoal, setIsDeletingGoal] = useState(false);

  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [isDeletingTask, setIsDeletingTask] = useState(false);

  const goalId = id ? parseInt(id, 10) : null;

  const fetchGoalAndTasks = useCallback(async () => {
    if (!goalId) return;
    setIsLoading(true);
    try {
      const [goalRes, tasksRes] = await Promise.all([
        api.get<Goal>(`/api/goals/${goalId}`),
        api.get<Task[]>('/api/tasks', { params: { goal_id: goalId } }),
      ]);
      setGoal(goalRes.data);
      setTasks(tasksRes.data || goalRes.data.tasks || []);
    } catch {
      toast.error('Failed to load goal details');
      navigate('/goals');
    } finally {
      setIsLoading(false);
    }
  }, [goalId, navigate]);

  useEffect(() => {
    fetchGoalAndTasks();
  }, [fetchGoalAndTasks]);

  // Goal deletion
  const handleDeleteGoal = async () => {
    if (!goalId) return;
    setIsDeletingGoal(true);
    try {
      await api.delete(`/api/goals/${goalId}`);
      toast.success('Goal deleted');
      navigate('/goals');
    } catch {
      toast.error('Failed to delete goal');
    } finally {
      setIsDeletingGoal(false);
    }
  };

  // Task actions
  const handleCompleteTask = async (taskId: number) => {
    try {
      await api.patch(`/api/tasks/${taskId}/complete`);
      toast.success('Task completed');
      fetchGoalAndTasks();
    } catch {
      try {
        await api.patch(`/api/tasks/${taskId}`, { status: 'completed' });
        toast.success('Task completed');
        fetchGoalAndTasks();
      } catch {
        toast.error('Failed to complete task');
      }
    }
  };

  const handleReopenTask = async (taskId: number) => {
    try {
      await api.patch(`/api/tasks/${taskId}/reopen`);
      toast.success('Task reopened');
      fetchGoalAndTasks();
    } catch {
      try {
        await api.patch(`/api/tasks/${taskId}`, { status: 'pending' });
        toast.success('Task reopened');
        fetchGoalAndTasks();
      } catch {
        toast.error('Failed to reopen task');
      }
    }
  };

  const handleDeleteTask = async () => {
    if (!deletingTask) return;
    setIsDeletingTask(true);
    try {
      await api.delete(`/api/tasks/${deletingTask.id}`);
      toast.success('Task deleted');
      setDeletingTask(null);
      fetchGoalAndTasks();
    } catch {
      toast.error('Failed to delete task');
    } finally {
      setIsDeletingTask(false);
    }
  };

  const formatTargetDate = (dateStr?: string) => {
    if (!dateStr) return null;
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

  if (isLoading) {
    return (
      <div className="py-20">
        <LoadingSpinner size="lg" label="Loading goal..." />
      </div>
    );
  }

  if (!goal) return null;

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const percentage =
    totalTasks > 0 ? Math.min(100, Math.round((completedTasks / totalTasks) * 100)) : 0;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link to="/goals" className="hover:text-indigo-600 transition-colors">
          Goals
        </Link>
        <ChevronRightIcon className="w-3.5 h-3.5" />
        <span className="text-slate-800 font-medium truncate">{goal.title}</span>
      </div>

      {/* Goal Header Card */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl font-bold text-slate-900">{goal.title}</h1>
              <StatusBadge status={goal.status} />
            </div>

            {goal.description && (
              <p className="text-sm text-slate-600 leading-relaxed max-w-2xl">
                {goal.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
              {goal.target_date && (
                <div className="flex items-center gap-1.5">
                  <CalendarIcon className="w-4 h-4 text-slate-400" />
                  <span>Target date: {formatTargetDate(goal.target_date)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 self-start">
            <button
              type="button"
              onClick={() => setIsEditGoalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
            >
              <EditIcon className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
            <button
              type="button"
              onClick={() => setIsDeleteGoalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-white border border-red-200 rounded-md hover:bg-red-50 transition-colors"
            >
              <TrashIcon className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>
        </div>

        {/* Goal Task Progress Bar */}
        <div className="mt-6 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs font-medium mb-1.5">
            <span className="text-slate-700">Goal Completion</span>
            <span className="text-slate-500">
              {completedTasks} of {totalTasks} tasks completed ({percentage}%)
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                percentage === 100 ? 'bg-emerald-500' : 'bg-indigo-600'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Linked Tasks Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ListTodoIcon className="w-5 h-5 text-indigo-600" />
            Linked Tasks ({tasks.length})
          </h2>

          <button
            type="button"
            onClick={() => setIsCreateTaskOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-2xs"
          >
            <PlusIcon className="w-4 h-4" />
            <span>Add Task to Goal</span>
          </button>
        </div>

        {tasks.length === 0 ? (
          <EmptyState
            icon={<ListTodoIcon className="w-6 h-6" />}
            title="No tasks linked to this goal yet"
            description="Add concrete tasks to break this goal down into manageable steps."
            actionLabel="Add Task"
            onAction={() => setIsCreateTaskOpen(true)}
          />
        ) : (
          <div className="space-y-2.5">
            {tasks.map((task) => (
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

      {/* Modals */}
      <EditGoalModal
        isOpen={isEditGoalOpen}
        goal={goal}
        onClose={() => setIsEditGoalOpen(false)}
        onGoalUpdated={() => fetchGoalAndTasks()}
      />

      <ConfirmDialog
        isOpen={isDeleteGoalOpen}
        title="Delete Goal"
        message={`Are you sure you want to delete "${goal.title}"? Associated tasks will remain available.`}
        confirmLabel="Delete Goal"
        isLoading={isDeletingGoal}
        onClose={() => setIsDeleteGoalOpen(false)}
        onConfirm={handleDeleteGoal}
      />

      <CreateTaskModal
        isOpen={isCreateTaskOpen}
        defaultGoalId={goal.id}
        onClose={() => setIsCreateTaskOpen(false)}
        onTaskCreated={() => fetchGoalAndTasks()}
      />

      <EditTaskModal
        isOpen={!!editingTask}
        task={editingTask}
        onClose={() => setEditingTask(null)}
        onTaskUpdated={() => fetchGoalAndTasks()}
      />

      <ConfirmDialog
        isOpen={!!deletingTask}
        title="Delete Task"
        message={`Are you sure you want to delete "${deletingTask?.title}"?`}
        confirmLabel="Delete Task"
        isLoading={isDeletingTask}
        onClose={() => setDeletingTask(null)}
        onConfirm={handleDeleteTask}
      />
    </div>
  );
};

export default GoalDetailPage;
