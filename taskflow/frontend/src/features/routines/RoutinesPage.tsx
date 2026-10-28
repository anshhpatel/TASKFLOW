import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import { Routine } from '../../types';
import RoutineCard from '../../components/RoutineCard';
import CreateRoutineModal from './CreateRoutineModal';
import EditRoutineModal from './EditRoutineModal';
import ConfirmDialog from '../../components/ConfirmDialog';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { PlusIcon, RotateCcwIcon } from '../../components/icons';

export const RoutinesPage: React.FC = () => {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);
  const [deletingRoutine, setDeletingRoutine] = useState<Routine | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const fetchRoutines = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get<Routine[]>('/api/routines');
      setRoutines(response.data || []);
    } catch {
      toast.error('Failed to load routines');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoutines();
  }, [fetchRoutines]);

  const handleToggleComplete = async (routineId: number, currentlyCompleted: boolean) => {
    try {
      await api.put(`/api/routines/${routineId}/completions/${todayStr}`, {
        completed: !currentlyCompleted,
      });
      toast.success(!currentlyCompleted ? 'Routine marked completed for today' : 'Routine marked incomplete');
      // Update local state directly for responsive feedback
      setRoutines((prev) =>
        prev.map((r) =>
          r.id === routineId ? { ...r, today_completed: !currentlyCompleted } : r
        )
      );
    } catch {
      toast.error('Failed to update routine completion');
    }
  };

  const handleDeleteRoutineConfirm = async () => {
    if (!deletingRoutine) return;
    setIsDeleting(true);
    try {
      await api.delete(`/api/routines/${deletingRoutine.id}`);
      toast.success('Routine deleted');
      setDeletingRoutine(null);
      fetchRoutines();
    } catch {
      toast.error('Failed to delete routine');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Routines</h1>
          <p className="text-xs text-slate-500 mt-1">
            Build consistency with recurring daily habits and schedules
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-md bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-2xs self-start sm:self-auto"
        >
          <PlusIcon className="w-4 h-4" />
          <span>New Routine</span>
        </button>
      </div>

      {/* Routine Cards Grid */}
      {isLoading ? (
        <div className="py-16">
          <LoadingSpinner size="lg" label="Loading routines..." />
        </div>
      ) : routines.length === 0 ? (
        <EmptyState
          icon={<RotateCcwIcon className="w-6 h-6" />}
          title="No routines created yet"
          description="Create recurring routines like daily standups, exercise, or journaling that appear on your Daily Missions."
          actionLabel="Create Routine"
          onAction={() => setIsCreateModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {routines.map((routine) => (
            <RoutineCard
              key={routine.id}
              routine={routine}
              onToggleComplete={handleToggleComplete}
              onEdit={(r) => setEditingRoutine(r)}
              onDelete={(r) => setDeletingRoutine(r)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <CreateRoutineModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onRoutineCreated={() => fetchRoutines()}
      />

      <EditRoutineModal
        isOpen={!!editingRoutine}
        routine={editingRoutine}
        onClose={() => setEditingRoutine(null)}
        onRoutineUpdated={() => fetchRoutines()}
      />

      <ConfirmDialog
        isOpen={!!deletingRoutine}
        title="Delete Routine"
        message={`Are you sure you want to delete "${deletingRoutine?.name}"? Its completion history will be removed.`}
        confirmLabel="Delete Routine"
        isLoading={isDeleting}
        onClose={() => setDeletingRoutine(null)}
        onConfirm={handleDeleteRoutineConfirm}
      />
    </div>
  );
};

export default RoutinesPage;
