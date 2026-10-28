import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';
import { api } from '../../lib/api';
import { Routine, UpdateRoutineInput } from '../../types';

interface EditRoutineModalProps {
  isOpen: boolean;
  routine: Routine | null;
  onClose: () => void;
  onRoutineUpdated: (routine: Routine) => void;
}

const DAYS_OF_WEEK = [
  { id: 'Mon', label: 'Mon' },
  { id: 'Tue', label: 'Tue' },
  { id: 'Wed', label: 'Wed' },
  { id: 'Thu', label: 'Thu' },
  { id: 'Fri', label: 'Fri' },
  { id: 'Sat', label: 'Sat' },
  { id: 'Sun', label: 'Sun' },
];

export const EditRoutineModal: React.FC<EditRoutineModalProps> = ({
  isOpen,
  routine,
  onClose,
  onRoutineUpdated,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [active, setActive] = useState<boolean>(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && routine) {
      setName(routine.name || '');
      setDescription(routine.description || '');
      setActive(routine.active ?? true);

      // Parse schedule_days
      const rawDays = routine.schedule_days || '';
      const days = rawDays
        .split(',')
        .map((d) => d.trim())
        .filter(Boolean);
      setSelectedDays(days);
      setErrors({});
    }
  }, [isOpen, routine]);

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
    if (errors.days) {
      setErrors((prev) => ({ ...prev, days: '' }));
    }
  };

  const selectAllDays = () => setSelectedDays(DAYS_OF_WEEK.map((d) => d.id));
  const selectWeekdays = () => setSelectedDays(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  const selectWeekends = () => setSelectedDays(['Sat', 'Sun']);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!name.trim()) {
      errs.name = 'Routine name is required';
    }
    if (selectedDays.length === 0) {
      errs.days = 'Please select at least one recurring day';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!routine || !validate()) return;

    setIsSubmitting(true);
    try {
      const payload: UpdateRoutineInput = {
        name: name.trim(),
        description: description.trim() || undefined,
        schedule_days: selectedDays.join(', '),
        active,
      };

      const response = await api.patch<Routine>(`/api/routines/${routine.id}`, payload);
      toast.success('Routine updated');
      onRoutineUpdated(response.data);
      onClose();
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail || 'Failed to update routine'
          : 'Failed to update routine';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Routine" maxWidth="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="edit-routine-name" className="block text-xs font-semibold text-slate-700 mb-1">
            Routine Name <span className="text-red-500">*</span>
          </label>
          <input
            id="edit-routine-name"
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
            }}
            className={`w-full text-sm px-3 py-2 bg-white border rounded-md focus:outline-hidden focus:ring-1 ${
              errors.name
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                : 'border-slate-300 focus:border-indigo-600 focus:ring-indigo-600'
            }`}
          />
          {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
        </div>

        <div>
          <label htmlFor="edit-routine-desc" className="block text-xs font-semibold text-slate-700 mb-1">
            Description
          </label>
          <textarea
            id="edit-routine-desc"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full text-sm px-3 py-2 bg-white border border-slate-300 rounded-md focus:outline-hidden focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="block text-xs font-semibold text-slate-700">
              Recurring Days <span className="text-red-500">*</span>
            </span>
            <div className="flex items-center gap-2 text-[11px] text-indigo-600">
              <button
                type="button"
                onClick={selectAllDays}
                className="hover:underline focus:outline-hidden"
              >
                Every day
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={selectWeekdays}
                className="hover:underline focus:outline-hidden"
              >
                Weekdays
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={selectWeekends}
                className="hover:underline focus:outline-hidden"
              >
                Weekends
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {DAYS_OF_WEEK.map((day) => {
              const isSelected = selectedDays.includes(day.id);
              return (
                <button
                  key={day.id}
                  type="button"
                  onClick={() => toggleDay(day.id)}
                  className={`w-10 h-10 rounded-lg text-xs font-semibold transition-all ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {day.label}
                </button>
              );
            })}
          </div>
          {errors.days && <p className="mt-1.5 text-xs text-red-600">{errors.days}</p>}
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input
            id="routine-active-toggle"
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
          />
          <label htmlFor="routine-active-toggle" className="text-xs text-slate-700 font-medium">
            Routine is active (generates daily mission occurrences)
          </label>
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
            Save Changes
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default EditRoutineModal;
