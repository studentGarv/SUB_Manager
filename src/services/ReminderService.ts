import { differenceInDays } from 'date-fns';
import type { Reminder, ReminderInput, FilterCriteria } from '../models/types';
import { ValidationService } from './ValidationService';
import { StorageService } from './StorageService';
import { RecurrenceCalculator } from './RecurrenceCalculator';

export class ReminderService {
  private validationService: ValidationService;
  private storageService: StorageService;
  private recurrenceCalculator: RecurrenceCalculator;

  constructor() {
    this.validationService = new ValidationService();
    this.storageService = new StorageService();
    this.recurrenceCalculator = new RecurrenceCalculator();
  }

  createReminder(data: ReminderInput): Reminder {
    const validation = this.validationService.validateReminderInput(data);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
    }

    // Validate custom recurrence
    if (data.recurrence === 'custom' && (!data.customRecurrenceDays || data.customRecurrenceDays <= 0)) {
      throw new Error('Custom recurrence requires a positive number of days');
    }

    const now = new Date();
    const dueDate = new Date(data.dueDate);
    
    const reminder: Reminder = {
      id: this.generateId(),
      name: data.name,
      amount: data.amount,
      currency: data.currency || 'USD',
      dueDate,
      category: data.category,
      recurrence: data.recurrence,
      customRecurrenceDays: data.customRecurrenceDays,
      notes: data.notes,
      status: this.calculateStatus(dueDate),
      completionHistory: [],
      createdAt: now,
      updatedAt: now,
    };

    this.storageService.saveReminder(reminder);
    return reminder;
  }

  updateReminder(id: string, data: Partial<ReminderInput>): Reminder {
    const existing = this.storageService.getReminder(id);
    if (!existing) {
      throw new Error('Reminder not found');
    }

    const updatedData: ReminderInput = {
      name: data.name ?? existing.name,
      amount: data.amount ?? existing.amount,
      currency: data.currency ?? existing.currency,
      dueDate: data.dueDate ?? existing.dueDate.toISOString(),
      category: data.category ?? existing.category,
      recurrence: data.recurrence ?? existing.recurrence,
      customRecurrenceDays: data.customRecurrenceDays ?? existing.customRecurrenceDays,
      notes: data.notes ?? existing.notes,
    };

    const validation = this.validationService.validateReminderInput(updatedData);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
    }

    // Validate custom recurrence
    if (updatedData.recurrence === 'custom' && (!updatedData.customRecurrenceDays || updatedData.customRecurrenceDays <= 0)) {
      throw new Error('Custom recurrence requires a positive number of days');
    }

    const dueDate = new Date(updatedData.dueDate);
    
    const updated: Reminder = {
      ...existing,
      name: updatedData.name,
      amount: updatedData.amount,
      currency: updatedData.currency,
      dueDate,
      category: updatedData.category,
      recurrence: updatedData.recurrence,
      customRecurrenceDays: updatedData.customRecurrenceDays,
      notes: updatedData.notes,
      status: this.calculateStatus(dueDate),
      updatedAt: new Date(),
    };

    this.storageService.updateReminder(id, updated);
    return updated;
  }

  deleteReminder(id: string): void {
    this.storageService.deleteReminder(id);
  }

  getAllReminders(): Reminder[] {
    const reminders = this.storageService.getAllReminders();
    return this.sortByDueDate(reminders);
  }

  markComplete(id: string): Reminder {
    const reminder = this.storageService.getReminder(id);
    if (!reminder) {
      throw new Error('Reminder not found');
    }

    const completionRecord = {
      completedAt: new Date(),
      originalDueDate: reminder.dueDate,
    };

    const updatedReminder: Reminder = {
      ...reminder,
      completionHistory: [...reminder.completionHistory, completionRecord],
      updatedAt: new Date(),
    };

    if (reminder.recurrence !== 'one-time') {
      const nextDueDate = this.recurrenceCalculator.calculateNextOccurrence(reminder);
      updatedReminder.dueDate = nextDueDate;
      updatedReminder.status = this.calculateStatus(nextDueDate);
    } else {
      updatedReminder.status = 'completed';
    }

    this.storageService.updateReminder(id, updatedReminder);
    return updatedReminder;
  }

  getUpcomingReminders(daysAhead: number = 7): Reminder[] {
    const now = new Date();
    const reminders = this.getAllReminders();
    
    return reminders.filter(reminder => {
      const daysUntilDue = differenceInDays(reminder.dueDate, now);
      return daysUntilDue >= 0 && daysUntilDue <= daysAhead && reminder.status !== 'completed';
    });
  }

  getOverdueReminders(): Reminder[] {
    const now = new Date();
    const reminders = this.getAllReminders();
    
    return reminders.filter(reminder => {
      return reminder.dueDate < now && reminder.status !== 'completed';
    });
  }

  filterReminders(criteria: FilterCriteria): Reminder[] {
    let reminders = this.getAllReminders();

    if (criteria.category) {
      reminders = reminders.filter(r => r.category === criteria.category);
    }

    if (criteria.status) {
      reminders = reminders.filter(r => r.status === criteria.status);
    }

    if (criteria.searchText) {
      const searchLower = criteria.searchText.toLowerCase();
      reminders = reminders.filter(r => 
        r.name.toLowerCase().includes(searchLower)
      );
    }

    return reminders;
  }

  private sortByDueDate(reminders: Reminder[]): Reminder[] {
    return [...reminders].sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  }

  private calculateStatus(dueDate: Date): 'active' | 'overdue' {
    const now = new Date();
    return dueDate < now ? 'overdue' : 'active';
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
