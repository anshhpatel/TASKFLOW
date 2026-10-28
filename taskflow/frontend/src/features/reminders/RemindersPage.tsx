import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import { Reminder, Notification, Task, Routine, CreateReminderInput } from '../../types';
import ReminderCard from '../../components/ReminderCard';
import NotificationItem from '../../components/NotificationItem';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { BellIcon, PlusIcon, ClockIcon, CheckCircleIcon } from '../../components/icons';

export const RemindersPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'reminders' | 'notifications'>('reminders');

  // Reminders state
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isRemindersLoading, setIsRemindersLoading] = useState(true);
  const [isCreateReminderOpen, setIsCreateReminderOpen] = useState(false);
  const [deletingReminder, setDeletingReminder] = useState<Reminder | null>(null);
  const [isDeletingReminder, setIsDeletingReminder] = useState(false);

  // Notifications state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isNotificationsLoading, setIsNotificationsLoading] = useState(true);

  // Create Reminder Modal state
  const [targetType, setTargetType] = useState<'task' | 'routine'>('task');
  const [selectedTargetId, setSelectedTargetId] = useState<string>('');
  const [dueAt, setDueAt] = useState<string>('');
  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
  const [availableRoutines, setAvailableRoutines] = useState<Routine[]>([]);
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({});
  const [isCreatingReminder, setIsCreatingReminder] = useState(false);

  const fetchReminders = useCallback(async () => {
    setIsRemindersLoading(true);
    try {
      const response = await api.get<Reminder[]>('/api/reminders');
      setReminders(response.data || []);
    } catch {
      toast.error('Failed to load reminders');
    } finally {
      setIsRemindersLoading(false);
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    setIsNotificationsLoading(true);
    try {
      const response = await api.get<Notification[]>('/api/notifications');
      setNotifications(response.data || []);
    } catch {
      toast.error('Failed to load notifications');
    } finally {
      setIsNotificationsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReminders();
    fetchNotifications();
  }, [fetchReminders, fetchNotifications]);

  // Load tasks & routines for reminder target dropdown
  useEffect(() => {
    if (isCreateReminderOpen) {
      setTargetType('task');
      setSelectedTargetId('');
      setDueAt('');
      setCreateErrors({});

      api.get<Task[]>('/api/tasks').then((res) => setAvailableTasks(res.data || [])).catch(() => {});
      api.get<Routine[]>('/api/routines').then((res) => setAvailableRoutines(res.data || [])).catch(() => {});
    }
  }, [isCreateReminderOpen]);

  // Toggle Reminder Enabled
  const handleToggleReminderEnabled = async (reminderId: number, currentEnabled: boolean) => {
    try {
      await api.patch(`/api/reminders/${reminderId}`, {
        enabled: !currentEnabled,
      });
      setReminders((prev) =>
        prev.map((r) => (r.id === reminderId ? { ...r, enabled: !currentEnabled } : r))
      );
      toast.success(!currentEnabled ? 'Reminder enabled' : 'Reminder disabled');
    } catch {
      toast.error('Failed to update reminder');
    }
  };

  // Delete Reminder
  const handleDeleteReminderConfirm = async () => {
    if (!deletingReminder) return;
    setIsDeletingReminder(true);
    try {
      await api.delete(`/api/reminders/${deletingReminder.id}`);
      toast.success('Reminder removed');
      setDeletingReminder(null);
      fetchReminders();
    } catch {
      toast.error('Failed to delete reminder');
    } finally {
      setIsDeletingReminder(false);
    }
  };

  // Create Reminder Submit
  const handleCreateReminderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!selectedTargetId) {
      errors.target = `Please select a ${targetType}`;
    }
    if (!dueAt) {
      errors.dueAt = 'Please select a reminder date and time';
    }

    if (Object.keys(errors).length > 0) {
      setCreateErrors(errors);
      return;
    }

    setIsCreatingReminder(true);
    try {
      const payload: CreateReminderInput = {
        due_at: new Date(dueAt).toISOString(),
        enabled: true,
        task_id: targetType === 'task' ? Number(selectedTargetId) : null,
        routine_id: targetType === 'routine' ? Number(selectedTargetId) : null,
      };

      await api.post('/api/reminders', payload);
      toast.success('Reminder scheduled successfully');
      setIsCreateReminderOpen(false);
      fetchReminders();
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail || 'Failed to create reminder'
          : 'Failed to create reminder';
      toast.error(message);
    } finally {
      setIsCreatingReminder(false);
    }
  };

  // Notification actions
  const handleMarkRead = async (notificationId: number) => {
    try {
      await api.patch(`/api/notifications/${notificationId}/read`);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n
        )
      );
    } catch {
      toast.error('Failed to update notification');
    }
  };

  const handleMarkAllRead = async () => {
    const unread = notifications.filter((n) => !n.read_at);
    if (unread.length === 0) return;

    try {
      await Promise.all(
        unread.map((n) => api.patch(`/api/notifications/${n.id}/read`).catch(() => {}))
      );
      toast.success('All marked as read');
      fetchNotifications();
    } catch {
      toast.error('Failed to mark all as read');
    }
  };

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Reminders & Notifications
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Keep track of upcoming deadlines, alert triggers, and system notifications
          </p>
        </div>

        {activeTab === 'reminders' && (
          <button
            type="button"
            onClick={() => setIsCreateReminderOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-md bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-2xs self-start sm:self-auto"
          >
            <PlusIcon className="w-4 h-4" />
            <span>New Reminder</span>
          </button>
        )}

        {activeTab === 'notifications' && unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-md bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs self-start sm:self-auto"
          >
            <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
            <span>Mark All as Read</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('reminders')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            activeTab === 'reminders'
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ClockIcon className="w-4 h-4" />
          <span>Reminders</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-700 text-slate-200">
            {reminders.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('notifications')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            activeTab === 'notifications'
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <BellIcon className="w-4 h-4" />
          <span>Notifications</span>
          {unreadCount > 0 ? (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-red-500 text-white font-bold">
              {unreadCount}
            </span>
          ) : (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-600">
              {notifications.length}
            </span>
          )}
        </button>
      </div>

      {/* Reminders Tab Content */}
      {activeTab === 'reminders' && (
        <div>
          {isRemindersLoading ? (
            <div className="py-16">
              <LoadingSpinner size="lg" label="Loading reminders..." />
            </div>
          ) : reminders.length === 0 ? (
            <EmptyState
              icon={<ClockIcon className="w-6 h-6" />}
              title="No reminders scheduled"
              description="Set up timely prompts for tasks and routines to maintain consistency."
              actionLabel="Schedule Reminder"
              onAction={() => setIsCreateReminderOpen(true)}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {reminders.map((reminder) => (
                <ReminderCard
                  key={reminder.id}
                  reminder={reminder}
                  onToggleEnabled={handleToggleReminderEnabled}
                  onDelete={(r) => setDeletingReminder(r)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Notifications Tab Content */}
      {activeTab === 'notifications' && (
        <div>
          {isNotificationsLoading ? (
            <div className="py-16">
              <LoadingSpinner size="lg" label="Loading notifications..." />
            </div>
          ) : notifications.length === 0 ? (
            <EmptyState
              icon={<BellIcon className="w-6 h-6" />}
              title="No notifications yet"
              description="When reminders fire or consistency milestones are reached, they will appear here."
            />
          ) : (
            <div className="space-y-3">
              {notifications.map((notif) => (
                <NotificationItem
                  key={notif.id}
                  notification={notif}
                  onMarkRead={handleMarkRead}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Reminder Modal */}
      <Modal
        isOpen={isCreateReminderOpen}
        onClose={() => setIsCreateReminderOpen(false)}
        title="Schedule New Reminder"
        maxWidth="md"
      >
        <form onSubmit={handleCreateReminderSubmit} className="space-y-4">
          {/* Target Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Reminder Target <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="radio"
                  name="targetType"
                  value="task"
                  checked={targetType === 'task'}
                  onChange={() => {
                    setTargetType('task');
                    setSelectedTargetId('');
                  }}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <span>Task</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="radio"
                  name="targetType"
                  value="routine"
                  checked={targetType === 'routine'}
                  onChange={() => {
                    setTargetType('routine');
                    setSelectedTargetId('');
                  }}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <span>Routine</span>
              </label>
            </div>
          </div>

          {/* Target Item Selection */}
          <div>
            <label htmlFor="reminder-target-select" className="block text-xs font-semibold text-slate-700 mb-1">
              Select {targetType === 'task' ? 'Task' : 'Routine'} <span className="text-red-500">*</span>
            </label>
            <select
              id="reminder-target-select"
              value={selectedTargetId}
              onChange={(e) => {
                setSelectedTargetId(e.target.value);
                if (createErrors.target) setCreateErrors((prev) => ({ ...prev, target: '' }));
              }}
              className={`w-full text-sm px-3 py-2 bg-white border rounded-md focus:outline-hidden focus:ring-1 ${
                createErrors.target
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-slate-300 focus:border-indigo-600 focus:ring-indigo-600'
              }`}
            >
              <option value="">-- Choose {targetType === 'task' ? 'a task' : 'a routine'} --</option>
              {targetType === 'task'
                ? availableTasks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))
                : availableRoutines.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
            </select>
            {createErrors.target && (
              <p className="mt-1 text-xs text-red-600">{createErrors.target}</p>
            )}
          </div>

          {/* Due Time */}
          <div>
            <label htmlFor="reminder-due-at" className="block text-xs font-semibold text-slate-700 mb-1">
              Reminder Due Time <span className="text-red-500">*</span>
            </label>
            <input
              id="reminder-due-at"
              type="datetime-local"
              value={dueAt}
              onChange={(e) => {
                setDueAt(e.target.value);
                if (createErrors.dueAt) setCreateErrors((prev) => ({ ...prev, dueAt: '' }));
              }}
              className={`w-full text-sm px-3 py-2 bg-white border rounded-md focus:outline-hidden focus:ring-1 ${
                createErrors.dueAt
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-slate-300 focus:border-indigo-600 focus:ring-indigo-600'
              }`}
            />
            {createErrors.dueAt && (
              <p className="mt-1 text-xs text-red-600">{createErrors.dueAt}</p>
            )}
          </div>

          {/* Actions */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreateReminderOpen(false)}
              disabled={isCreatingReminder}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreatingReminder}
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md bg-indigo-600 hover:bg-indigo-700 text-white transition-colors disabled:opacity-50"
            >
              {isCreatingReminder && <LoadingSpinner size="sm" className="mr-2" />}
              Set Reminder
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Reminder Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingReminder}
        title="Delete Reminder"
        message="Are you sure you want to remove this reminder?"
        confirmLabel="Delete"
        isLoading={isDeletingReminder}
        onClose={() => setDeletingReminder(null)}
        onConfirm={handleDeleteReminderConfirm}
      />
    </div>
  );
};

export default RemindersPage;
