import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import { Goal } from '../../types';
import GoalCard from '../../components/GoalCard';
import CreateGoalModal from './CreateGoalModal';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { PlusIcon, TargetIcon } from '../../components/icons';

export const GoalsPage: React.FC = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed' | 'archived'>('active');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const fetchGoals = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get<Goal[]>('/api/goals');
      setGoals(response.data || []);
    } catch {
      toast.error('Failed to load goals');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const filteredGoals = goals.filter((goal) => {
    if (statusFilter === 'all') return true;
    return goal.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Goals</h1>
          <p className="text-xs text-slate-500 mt-1">
            Track broader objectives and group linked daily tasks
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-md bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-2xs self-start sm:self-auto"
        >
          <PlusIcon className="w-4 h-4" />
          <span>New Goal</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        {(['active', 'completed', 'archived', 'all'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setStatusFilter(tab)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors ${
              statusFilter === tab
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="py-16">
          <LoadingSpinner size="lg" label="Loading goals..." />
        </div>
      ) : filteredGoals.length === 0 ? (
        <EmptyState
          icon={<TargetIcon className="w-6 h-6" />}
          title={`No ${statusFilter === 'all' ? '' : statusFilter} goals found`}
          description="Create a goal to organize your tasks and maintain a clear sense of direction."
          actionLabel="Create Goal"
          onAction={() => setIsCreateModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGoals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} />
          ))}
        </div>
      )}

      {/* Create Modal */}
      <CreateGoalModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onGoalCreated={() => fetchGoals()}
      />
    </div>
  );
};

export default GoalsPage;
