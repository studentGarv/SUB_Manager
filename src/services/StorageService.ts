import type { Reminder } from '../models/types';

const STORAGE_KEY = 'reminder-manager-reminders';

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
      dueDate: new Date(data.dueDate),
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
      completionHistory: data.completionHistory.map((record: any) => ({
        completedAt: new Date(record.completedAt),
        originalDueDate: new Date(record.originalDueDate),
      })),
    };
  }
}
