import type { Reminder, NotificationPreferences } from '../models/types';

const STORAGE_KEY = 'reminder-manager-reminders';
const NOTIFICATION_PREFS_KEY = 'reminder-manager-notification-prefs';

export class StorageService {
  private isStorageAvailable(): boolean {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  saveReminder(reminder: Reminder): void {
    try {
      const reminders = this.getAllReminders();
      const existingIndex = reminders.findIndex(r => r.id === reminder.id);
      
      if (existingIndex >= 0) {
        reminders[existingIndex] = reminder;
      } else {
        reminders.push(reminder);
      }

      this.saveAll(reminders);
    } catch (e) {
      if (e instanceof Error && e.name === 'QuotaExceededError') {
        throw new Error('Storage quota exceeded. Please delete some reminders.');
      }
      throw new Error('Failed to save reminder to storage');
    }
  }

  getReminder(id: string): Reminder | null {
    const reminders = this.getAllReminders();
    return reminders.find(r => r.id === id) || null;
  }

  getAllReminders(): Reminder[] {
    if (!this.isStorageAvailable()) {
      console.warn('Local storage is not available');
      return [];
    }

    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        return [];
      }

      const parsed = JSON.parse(data);
      return parsed.map((r: any) => this.deserializeReminder(r));
    } catch (e) {
      console.error('Failed to load reminders from storage', e);
      return [];
    }
  }

  updateReminder(_id: string, reminder: Reminder): void {
    this.saveReminder(reminder);
  }

  deleteReminder(id: string): void {
    try {
      const reminders = this.getAllReminders().filter(r => r.id !== id);
      this.saveAll(reminders);
    } catch (e) {
      throw new Error('Failed to delete reminder from storage');
    }
  }

  private saveAll(reminders: Reminder[]): void {
    if (!this.isStorageAvailable()) {
      throw new Error('Local storage is not available');
    }

    const serialized = reminders.map(r => this.serializeReminder(r));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serialized));
  }

  private serializeReminder(reminder: Reminder): any {
    return {
      ...reminder,
      dueDate: reminder.dueDate.toISOString(),
      createdAt: reminder.createdAt.toISOString(),
      updatedAt: reminder.updatedAt.toISOString(),
      completionHistory: reminder.completionHistory.map(record => ({
        completedAt: record.completedAt.toISOString(),
        originalDueDate: record.originalDueDate.toISOString(),
      })),
    };
  }

  private deserializeReminder(data: any): Reminder {
    return {
      ...data,
      currency: data.currency || 'USD', // Default to USD for existing reminders
      notificationsEnabled: data.notificationsEnabled !== undefined ? data.notificationsEnabled : true, // Default to enabled
      dueDate: new Date(data.dueDate),
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
      completionHistory: data.completionHistory.map((record: any) => ({
        completedAt: new Date(record.completedAt),
        originalDueDate: new Date(record.originalDueDate),
      })),
    };
  }

  // Notification preferences methods
  saveNotificationPreferences(preferences: NotificationPreferences): void {
    if (!this.isStorageAvailable()) {
      throw new Error('Local storage is not available');
    }

    try {
      localStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify(preferences));
    } catch (e) {
      throw new Error('Failed to save notification preferences');
    }
  }

  getNotificationPreferences(): NotificationPreferences | null {
    if (!this.isStorageAvailable()) {
      return null;
    }

    try {
      const data = localStorage.getItem(NOTIFICATION_PREFS_KEY);
      if (!data) {
        // Return default preferences
        return {
          browserNotificationsEnabled: false,
          notificationTiming: ['1-day'],
          autoGenerateCalendarLinks: false,
        };
      }

      return JSON.parse(data);
    } catch (e) {
      console.error('Failed to load notification preferences', e);
      return null;
    }
  }
}
