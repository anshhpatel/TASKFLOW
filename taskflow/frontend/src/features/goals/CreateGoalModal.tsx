import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';
import { api } from '../../lib/api';
import { Goal, CreateGoalInput } from '../../types';

interface CreateGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoalCreated: (goal: Goal) => void;
}

export const CreateGoalModal: React.FC<CreateGoalModalProps> = ({
  isOpen,
  onClose,
  onGoalCreated,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [status, setStatus] = useState<'active' | 'completed' | 'archived'>('active');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setDescription('');
      setTargetDate('');
      setStatus('active');
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Goal title is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CreateGoalInput = {
        title: trimmedTitle,
        description: description.trim() || undefined,
        target_date: targetDate ? new Date(targetDate).toISOString() : null,
        status,
      };

      const response = await api.post<Goal>('/api/goals', payload);
      toast.success('Goal created successfully');
      onGoalCreated(response.data);
      onClose();
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail || 'Failed to create goal'
          : 'Failed to create goal';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Goal" maxWidth="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="create-goal-title" className="block text-xs font-semibold text-slate-700 mb-1">
            Goal Title <span className="text-red-500">*</span>
          </label>
          <input
            id="create-goal-title"
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (error) setError(null);
            }}
            placeholder="e.g. Launch Taskflow prototype"
            className={`w-full text-sm px-3 py-2 bg-white border rounded-md focus:outline-hidden focus:ring-1 ${
              error
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                : 'border-slate-300 focus:border-indigo-600 focus:ring-indigo-600'
            }`}
          />
          {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>

        <div>
          <label htmlFor="create-goal-desc" className="block text-xs font-semibold text-slate-700 mb-1">
            Description (Optional)
          </label>
          <textarea
            id="create-goal-desc"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What does success look like for this goal?"
            className="w-full text-sm px-3 py-2 bg-white border border-slate-300 rounded-md focus:outline-hidden focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="create-goal-target" className="block text-xs font-semibold text-slate-700 mb-1">
              Target Date (Optional)
            </label>
            <input
              id="create-goal-target"
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full text-sm px-3 py-2 bg-white border border-slate-300 rounded-md focus:outline-hidden focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
            />
          </div>

          <div>
            <label htmlFor="create-goal-status" className="block text-xs font-semibold text-slate-700 mb-1">
              Initial Status
            </label>
            <select
              id="create-goal-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as 'active' | 'completed' | 'archived')}
              className="w-full text-sm px-3 py-2 bg-white border border-slate-300 rounded-md focus:outline-hidden focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
            >
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

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
            Create Goal
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateGoalModal;
