import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { api } from '../lib/api';
import { Task, CreateTaskInput, UpdateTaskInput } from '../types';

interface TaskFilters {
  status?: 'all' | 'pending' | 'completed';
  priority?: string;
  goal_id?: number;
  sortBy?: 'deadline' | 'created_at' | 'priority';
  sortOrder?: 'asc' | 'desc';
}

export const useTasks = (initialGoalId?: number) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async (filters?: TaskFilters) => {
    setIsLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number> = {};
      const statusFilter = filters?.status;
      if (statusFilter && statusFilter !== 'all') {
        params.status = statusFilter;
      }
      if (filters?.priority && filters.priority !== 'all') {
        params.priority = filters.priority;
      }
      const goalId = filters?.goal_id ?? initialGoalId;
      if (goalId !== undefined) {
        params.goal_id = goalId;
      }

      const response = await api.get<Task[]>('/api/tasks', { params });
      let data = response.data || [];

      // Sort if requested
      if (filters?.sortBy === 'deadline') {
        data = [...data].sort((a, b) => {
          if (!a.deadline) return 1;
          if (!b.deadline) return -1;
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        });
      }

      setTasks(data);
      return data;
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to load tasks';
      setError(message);
      toast.error(message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [initialGoalId]);

  const createTask = async (input: CreateTaskInput): Promise<Task | null> => {
    try {
      const response = await api.post<Task>('/api/tasks', input);
      setTasks((prev) => [response.data, ...prev]);
      toast.success('Task created successfully');
      return response.data;
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail || 'Failed to create task'
          : 'Failed to create task';
      toast.error(message);
      return null;
    }
  };

  const updateTask = async (id: number, input: UpdateTaskInput): Promise<Task | null> => {
    try {
      const response = await api.patch<Task>(`/api/tasks/${id}`, input);
      setTasks((prev) => prev.map((t) => (t.id === id ? response.data : t)));
      toast.success('Task updated');
      return response.data;
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail || 'Failed to update task'
          : 'Failed to update task';
      toast.error(message);
      return null;
    }
  };

  const completeTask = async (id: number): Promise<boolean> => {
    try {
      const response = await api.patch<Task>(`/api/tasks/${id}/complete`);
      setTasks((prev) => prev.map((t) => (t.id === id ? response.data : t)));
      toast.success('Task marked as completed');
      return true;
    } catch (err: unknown) {
      // Fallback: If PATCH /complete is not found, fallback to PATCH /api/tasks/{id} with status: 'completed'
      try {
        const fallbackRes = await api.patch<Task>(`/api/tasks/${id}`, { status: 'completed' });
        setTasks((prev) => prev.map((t) => (t.id === id ? fallbackRes.data : t)));
        toast.success('Task marked as completed');
        return true;
      } catch {
        const message =
          err && typeof err === 'object' && 'response' in err
            ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail || 'Failed to complete task'
            : 'Failed to complete task';
        toast.error(message);
        return false;
      }
    }
  };

  const reopenTask = async (id: number): Promise<boolean> => {
    try {
      const response = await api.patch<Task>(`/api/tasks/${id}/reopen`);
      setTasks((prev) => prev.map((t) => (t.id === id ? response.data : t)));
      toast.success('Task reopened');
      return true;
    } catch {
      try {
        const fallbackRes = await api.patch<Task>(`/api/tasks/${id}`, { status: 'pending' });
        setTasks((prev) => prev.map((t) => (t.id === id ? fallbackRes.data : t)));
        toast.success('Task reopened');
        return true;
      } catch {
        toast.error('Failed to reopen task');
        return false;
      }
    }
  };

  const deleteTask = async (id: number): Promise<boolean> => {
    try {
      await api.delete(`/api/tasks/${id}`);
      setTasks((prev) => prev.filter((t) => t.id !== id));
      toast.success('Task deleted');
      return true;
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail || 'Failed to delete task'
          : 'Failed to delete task';
      toast.error(message);
      return false;
    }
  };

  return {
    tasks,
    setTasks,
    isLoading,
    error,
    fetchTasks,
    createTask,
    updateTask,
    completeTask,
    reopenTask,
    deleteTask,
  };
};

export default useTasks;
