import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import { Task } from '../../types';
import TaskCard from '../../components/TaskCard';
import CreateTaskModal from './CreateTaskModal';
import EditTaskModal from './EditTaskModal';
import ConfirmDialog from '../../components/ConfirmDialog';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { PlusIcon, ListTodoIcon } from '../../components/icons';

export const TasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & sorting
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'deadline' | 'created_at' | 'priority'>('deadline');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string> = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (priorityFilter !== 'all') params.priority = priorityFilter;

      const response = await api.get<Task[]>('/api/tasks', { params });
      let list = response.data || [];

      // Client-side sort
      if (sortBy === 'deadline') {
        list = [...list].sort((a, b) => {
          if (!a.deadline) return 1;
          if (!b.deadline) return -1;
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        });
      } else if (sortBy === 'priority') {
        const weight: Record<string, number> = { high: 3, medium: 2, low: 1 };
        list = [...list].sort((a, b) => (weight[b.priority] || 0) - (weight[a.priority] || 0));
      } else if (sortBy === 'created_at') {
        list = [...list].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      }

      setTasks(list);
    } catch {
      toast.error('Failed to load tasks');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, priorityFilter, sortBy]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleCompleteTask = async (taskId: number) => {
    try {
      await api.patch(`/api/tasks/${taskId}/complete`);
      toast.success('Task marked completed');
      fetchTasks();
    } catch {
      try {
        await api.patch(`/api/tasks/${taskId}`, { status: 'completed' });
        toast.success('Task marked completed');
        fetchTasks();
      } catch {
        toast.error('Failed to complete task');
      }
    }
  };

  const handleReopenTask = async (taskId: number) => {
    try {
      await api.patch(`/api/tasks/${taskId}/reopen`);
      toast.success('Task reopened');
      fetchTasks();
    } catch {
      try {
        await api.patch(`/api/tasks/${taskId}`, { status: 'pending' });
        toast.success('Task reopened');
        fetchTasks();
      } catch {
        toast.error('Failed to reopen task');
      }
    }
  };

  const handleDeleteTaskConfirm = async () => {
    if (!deletingTask) return;
    setIsDeleting(true);
    try {
      await api.delete(`/api/tasks/${deletingTask.id}`);
      toast.success('Task deleted');
      setDeletingTask(null);
      fetchTasks();
    } catch {
      toast.error('Failed to delete task');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Tasks</h1>
          <p className="text-xs text-slate-500 mt-1">
            Organize, prioritize, and manage all your to-dos
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-md bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-2xs self-start sm:self-auto"
        >
          <PlusIcon className="w-4 h-4" />
          <span>New Task</span>
        </button>
      </div>

      {/* Filter and Sort Toolbar */}
      <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        {/* Status Filters */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-slate-500 mr-1">Status:</span>
          {(['all', 'pending', 'completed'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md capitalize transition-colors ${
                statusFilter === s
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Priority & Sorting */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <label htmlFor="priority-filter" className="text-xs font-medium text-slate-500">
              Priority:
            </label>
            <select
              id="priority-filter"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 text-slate-700 rounded-md px-2 py-1 focus:outline-hidden focus:ring-1 focus:ring-indigo-600 cursor-pointer"
            >
              <option value="all">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <label htmlFor="sort-by" className="text-xs font-medium text-slate-500">
              Sort by:
            </label>
            <select
              id="sort-by"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'deadline' | 'created_at' | 'priority')}
              className="text-xs bg-slate-50 border border-slate-200 text-slate-700 rounded-md px-2 py-1 focus:outline-hidden focus:ring-1 focus:ring-indigo-600 cursor-pointer"
            >
              <option value="deadline">Deadline</option>
              <option value="priority">Priority</option>
              <option value="created_at">Date Created</option>
            </select>
          </div>
        </div>
      </div>

      {/* Task List */}
      {isLoading ? (
        <div className="py-16">
          <LoadingSpinner size="lg" label="Loading tasks..." />
        </div>
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={<ListTodoIcon className="w-6 h-6" />}
          title="No tasks found"
          description="Try relaxing your filters or create a new task to get started."
          actionLabel="Create Task"
          onAction={() => setIsCreateModalOpen(true)}
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

      {/* Modals */}
      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onTaskCreated={() => fetchTasks()}
      />

      <EditTaskModal
        isOpen={!!editingTask}
        task={editingTask}
        onClose={() => setEditingTask(null)}
        onTaskUpdated={() => fetchTasks()}
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

export default TasksPage;
