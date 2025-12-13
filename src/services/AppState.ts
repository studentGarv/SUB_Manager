import type { Reminder, FilterCriteria, NotificationPreferences } from '../models/types';

type StateSubscriber = () => void;

export interface AppStateData {
  reminders: Reminder[];
  filters: FilterCriteria;
  editingReminderId: string | null;
  dismissedNotifications: Set<string>;
  notificationPreferences: NotificationPreferences | null;
}

export class AppState {
  private state: AppStateData;
  private subscribers: StateSubscriber[] = [];

  constructor() {
    this.state = {
      reminders: [],
      filters: {},
      editingReminderId: null,
      dismissedNotifications: new Set(),
      notificationPreferences: null,
    };
  }

  getState(): Readonly<AppStateData> {
    return { 
      ...this.state, 
      dismissedNotifications: new Set(this.state.dismissedNotifications),
      notificationPreferences: this.state.notificationPreferences ? { ...this.state.notificationPreferences } : null
    };
  }

  setReminders(reminders: Reminder[]): void {
    this.state.reminders = reminders;
    this.notifySubscribers();
  }

  setFilters(filters: FilterCriteria): void {
    this.state.filters = filters;
    this.notifySubscribers();
  }

  setEditingReminder(id: string | null): void {
    this.state.editingReminderId = id;
    this.notifySubscribers();
  }

  setNotificationPreferences(preferences: NotificationPreferences): void {
    this.state.notificationPreferences = preferences;
    this.notifySubscribers();
  }

  dismissNotification(reminderId: string): void {
    this.state.dismissedNotifications.add(reminderId);
    this.notifySubscribers();
  }

  clearDismissedNotifications(): void {
    this.state.dismissedNotifications.clear();
    this.notifySubscribers();
  }

  subscribe(callback: StateSubscriber): () => void {
    this.subscribers.push(callback);
    
    // Return unsubscribe function
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  private notifySubscribers(): void {
    this.subscribers.forEach(callback => callback());
  }
}
