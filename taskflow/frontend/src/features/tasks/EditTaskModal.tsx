import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';
import { api } from '../../lib/api';
import { Task, Goal, UpdateTaskInput } from '../../types';

interface EditTaskModalProps {
  isOpen: boolean;
  task: Task | null;
  onClose: () => void;
  onTaskUpdated: (task: Task) => void;
}

export const EditTaskModal: React.FC<EditTaskModalProps> = ({
  isOpen,
  task,
  onClose,
  onTaskUpdated,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [status, setStatus] = useState<'pending' | 'completed'>('pending');
  const [deadline, setDeadline] = useState('');
  const [scheduledStart, setScheduledStart] = useState('');
  const [scheduledEnd, setScheduledEnd] = useState('');
  const [goalId, setGoalId] = useState<string>('');
  const [availableGoals, setAvailableGoals] = useState<Goal[]>([]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper to convert ISO string to datetime-local format YYYY-MM-DDTHH:mm
  const toLocalInputValue = (isoStr?: string) => {
    if (!isoStr) return '';
    try {
      const d = new Date(isoStr);
      return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
    } catch {
      return '';
    }
  };

  useEffect(() => {
    if (isOpen && task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setPriority(task.priority || 'medium');
      setStatus(task.status || 'pending');
      setDeadline(toLocalInputValue(task.deadline));
      setScheduledStart(toLocalInputValue(task.scheduled_start));
      setScheduledEnd(toLocalInputValue(task.scheduled_end));
      setGoalId(task.goal_id ? String(task.goal_id) : '');
      setErrors({});

      api
        .get<Goal[]>('/api/goals')
        .then((res) => setAvailableGoals(res.data || []))
        .catch(() => setAvailableGoals([]));
    }
  }, [isOpen, task]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!title.trim()) {
      errs.title = 'Title is required';
    }
    if (scheduledStart && scheduledEnd) {
      if (new Date(scheduledEnd) < new Date(scheduledStart)) {
        errs.scheduledEnd = 'Scheduled end time cannot be before start time';
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task || !validate()) return;

    setIsSubmitting(true);
    try {
      const payload: UpdateTaskInput = {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        status,
        deadline: deadline ? new Date(deadline).toISOString() : null,
        scheduled_start: scheduledStart ? new Date(scheduledStart).toISOString() : null,
        scheduled_end: scheduledEnd ? new Date(scheduledEnd).toISOString() : null,
        goal_id: goalId ? Number(goalId) : null,
      };

      const response = await api.patch<Task>(`/api/tasks/${task.id}`, payload);
      toast.success('Task updated');
      onTaskUpdated(response.data);
      onClose();
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail || 'Failed to update task'
          : 'Failed to update task';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Task" maxWidth="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div>
          <label htmlFor="edit-task-title" className="block text-xs font-semibold text-slate-700 mb-1">
            Task Title <span className="text-red-500">*</span>
          </label>
          <input
            id="edit-task-title"
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (errors.title) setErrors((prev) => ({ ...prev, title: '' }));
            }}
            className={`w-full text-sm px-3 py-2 bg-white border rounded-md focus:outline-hidden focus:ring-1 ${
              errors.title
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                : 'border-slate-300 focus:border-indigo-600 focus:ring-indigo-600'
            }`}
          />
          {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title}</p>}
        </div>

        {/* Description */}
        <div>
          <label htmlFor="edit-task-desc" className="block text-xs font-semibold text-slate-700 mb-1">
            Description
          </label>
          <textarea
            id="edit-task-desc"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full text-sm px-3 py-2 bg-white border border-slate-300 rounded-md focus:outline-hidden focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
          />
        </div>

        {/* Status, Priority, Goal */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label htmlFor="edit-task-status" className="block text-xs font-semibold text-slate-700 mb-1">
              Status
            </label>
            <select
              id="edit-task-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as 'pending' | 'completed')}
              className="w-full text-sm px-3 py-2 bg-white border border-slate-300 rounded-md focus:outline-hidden focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
            >
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div>
            <label htmlFor="edit-task-priority" className="block text-xs font-semibold text-slate-700 mb-1">
              Priority
            </label>
            <select
              id="edit-task-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
              className="w-full text-sm px-3 py-2 bg-white border border-slate-300 rounded-md focus:outline-hidden focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
            </select>
          </div>

          <div>
            <label htmlFor="edit-task-goal" className="block text-xs font-semibold text-slate-700 mb-1">
              Goal
            </label>
            <select
              id="edit-task-goal"
              value={goalId}
              onChange={(e) => setGoalId(e.target.value)}
              className="w-full text-sm px-3 py-2 bg-white border border-slate-300 rounded-md focus:outline-hidden focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
            >
              <option value="">None</option>
              {availableGoals.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Deadline */}
        <div>
          <label htmlFor="edit-task-deadline" className="block text-xs font-semibold text-slate-700 mb-1">
            Deadline
          </label>
          <input
            id="edit-task-deadline"
            type="datetime-local"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="w-full text-sm px-3 py-2 bg-white border border-slate-300 rounded-md focus:outline-hidden focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
          />
        </div>

        {/* Scheduled Start & End */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="edit-task-start" className="block text-xs font-semibold text-slate-700 mb-1">
              Scheduled Start
            </label>
            <input
              id="edit-task-start"
              type="datetime-local"
              value={scheduledStart}
              onChange={(e) => {
                setScheduledStart(e.target.value);
                if (errors.scheduledEnd) setErrors((prev) => ({ ...prev, scheduledEnd: '' }));
              }}
              className="w-full text-sm px-3 py-2 bg-white border border-slate-300 rounded-md focus:outline-hidden focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
            />
          </div>

          <div>
            <label htmlFor="edit-task-end" className="block text-xs font-semibold text-slate-700 mb-1">
              Scheduled End
            </label>
            <input
              id="edit-task-end"
              type="datetime-local"
              value={scheduledEnd}
              onChange={(e) => {
                setScheduledEnd(e.target.value);
                if (errors.scheduledEnd) setErrors((prev) => ({ ...prev, scheduledEnd: '' }));
              }}
              className={`w-full text-sm px-3 py-2 bg-white border rounded-md focus:outline-hidden focus:ring-1 ${
                errors.scheduledEnd
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-slate-300 focus:border-indigo-600 focus:ring-indigo-600'
              }`}
            />
            {errors.scheduledEnd && (
              <p className="mt-1 text-xs text-red-600">{errors.scheduledEnd}</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md bg-indigo-600 hover:bg-indigo-700 text-white transition-colors disabled:opacity-50"
          >
            {isSubmitting && <LoadingSpinner size="sm" className="mr-2" />}
            Save Changes
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default EditTaskModal;
