import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';
import { api } from '../../lib/api';
import { Task, Goal, CreateTaskInput } from '../../types';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated: (task: Task) => void;
  defaultGoalId?: number;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  onTaskCreated,
  defaultGoalId,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [deadline, setDeadline] = useState('');
  const [scheduledStart, setScheduledStart] = useState('');
  const [scheduledEnd, setScheduledEnd] = useState('');
  const [goalId, setGoalId] = useState<string>(defaultGoalId ? String(defaultGoalId) : '');
  const [availableGoals, setAvailableGoals] = useState<Goal[]>([]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setDescription('');
      setPriority('medium');
      setDeadline('');
      setScheduledStart('');
      setScheduledEnd('');
      setGoalId(defaultGoalId ? String(defaultGoalId) : '');
      setErrors({});

      // Fetch user's active goals for goal selector
      api
        .get<Goal[]>('/api/goals')
        .then((res) => setAvailableGoals(res.data || []))
        .catch(() => setAvailableGoals([]));
    }
  }, [isOpen, defaultGoalId]);

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
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const payload: CreateTaskInput = {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        deadline: deadline ? new Date(deadline).toISOString() : null,
        scheduled_start: scheduledStart ? new Date(scheduledStart).toISOString() : null,
        scheduled_end: scheduledEnd ? new Date(scheduledEnd).toISOString() : null,
        goal_id: goalId ? Number(goalId) : null,
      };

      const response = await api.post<Task>('/api/tasks', payload);
      toast.success('Task created successfully');
      onTaskCreated(response.data);
      onClose();
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail || 'Failed to create task'
          : 'Failed to create task';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Task" maxWidth="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div>
          <label htmlFor="create-task-title" className="block text-xs font-semibold text-slate-700 mb-1">
            Task Title <span className="text-red-500">*</span>
          </label>
          <input
            id="create-task-title"
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (errors.title) setErrors((prev) => ({ ...prev, title: '' }));
            }}
            placeholder="e.g. Draft presentation slides"
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
          <label htmlFor="create-task-desc" className="block text-xs font-semibold text-slate-700 mb-1">
            Description (Optional)
          </label>
          <textarea
            id="create-task-desc"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief details or steps..."
            className="w-full text-sm px-3 py-2 bg-white border border-slate-300 rounded-md focus:outline-hidden focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
          />
        </div>

        {/* Priority & Goal */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="create-task-priority" className="block text-xs font-semibold text-slate-700 mb-1">
              Priority
            </label>
            <select
              id="create-task-priority"
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
            <label htmlFor="create-task-goal" className="block text-xs font-semibold text-slate-700 mb-1">
              Associated Goal (Optional)
            </label>
            <select
              id="create-task-goal"
              value={goalId}
              onChange={(e) => setGoalId(e.target.value)}
              className="w-full text-sm px-3 py-2 bg-white border border-slate-300 rounded-md focus:outline-hidden focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
            >
              <option value="">None (Independent Task)</option>
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
          <label htmlFor="create-task-deadline" className="block text-xs font-semibold text-slate-700 mb-1">
            Deadline (Optional)
          </label>
          <input
            id="create-task-deadline"
            type="datetime-local"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="w-full text-sm px-3 py-2 bg-white border border-slate-300 rounded-md focus:outline-hidden focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
          />
        </div>

        {/* Scheduled Start & End */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="create-task-start" className="block text-xs font-semibold text-slate-700 mb-1">
              Scheduled Start (Optional)
            </label>
            <input
              id="create-task-start"
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
            <label htmlFor="create-task-end" className="block text-xs font-semibold text-slate-700 mb-1">
              Scheduled End (Optional)
            </label>
            <input
              id="create-task-end"
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
            Create Task
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateTaskModal;
