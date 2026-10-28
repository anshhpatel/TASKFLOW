import React from 'react';

interface StatusBadgeProps {
  status: 'pending' | 'completed' | 'active' | 'archived';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const styles: Record<string, string> = {
    pending: 'bg-blue-50 text-blue-700 border-blue-200',
    completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    active: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    archived: 'bg-slate-100 text-slate-600 border-slate-200',
  };

  const labels: Record<string, string> = {
    pending: 'Pending',
    completed: 'Completed',
    active: 'Active',
    archived: 'Archived',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${styles[status] || styles.pending} ${className}`}
    >
      {labels[status] || status}
    </span>
  );
};

export default StatusBadge;
