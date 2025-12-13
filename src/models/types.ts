// Core type definitions for the Reminder Manager application

export type ReminderCategory = 'subscription' | 'tax' | 'insurance' | 'utility' | 'other';

export type RecurrencePattern = 'one-time' | 'monthly' | 'quarterly' | 'semi-annually' | 'annually' | 'custom';

export type ReminderStatus = 'active' | 'completed' | 'overdue';

export interface CompletionRecord {
  completedAt: Date;
  originalDueDate: Date;
}

export type Currency = 'USD' | 'EUR' | 'INR';

export interface Reminder {
  id: string;
  name: string;
  amount: number;
  currency: Currency;
  dueDate: Date;
  category: ReminderCategory;
  recurrence: RecurrencePattern;
  customRecurrenceDays?: number; // For custom recurrence pattern
  notes?: string;
  status: ReminderStatus;
  completionHistory: CompletionRecord[];
  notificationsEnabled: boolean; // Whether notifications are enabled for this reminder
  createdAt: Date;
  updatedAt: Date;
}

export interface ReminderInput {
  name: string;
  amount: number;
  currency: Currency;
  dueDate: string;
  category: ReminderCategory;
  recurrence: RecurrencePattern;
  customRecurrenceDays?: number;
  notes?: string;
  notificationsEnabled?: boolean;
}

export interface FilterCriteria {
  searchText?: string;
  category?: ReminderCategory;
  status?: ReminderStatus;
}

export interface ValidationResult {
  isValid: boolean;
  errors: { field: string; message: string }[];
}

// Type guards
export function isReminderCategory(value: string): value is ReminderCategory {
  return ['subscription', 'tax', 'insurance', 'utility', 'other'].includes(value);
}

export function isRecurrencePattern(value: string): value is RecurrencePattern {
  return ['one-time', 'monthly', 'quarterly', 'semi-annually', 'annually', 'custom'].includes(value);
}

export function isReminderStatus(value: string): value is ReminderStatus {
  return ['active', 'completed', 'overdue'].includes(value);
}

// Utility type for partial updates
export type ReminderUpdate = Partial<Omit<ReminderInput, 'id'>>;

// Notification types
export type NotificationTiming = '1-day' | '3-days' | '1-week' | 'custom';

export interface CustomNotificationTiming {
  days: number; // Number of days before due date
}

export interface NotificationPreferences {
  browserNotificationsEnabled: boolean;
  notificationTiming: NotificationTiming[];
  customTimingDays?: number; // For custom timing
  autoGenerateCalendarLinks: boolean;
}

// Type guard for notification timing
export function isNotificationTiming(value: string): value is NotificationTiming {
  return ['1-day', '3-days', '1-week', 'custom'].includes(value);
}
