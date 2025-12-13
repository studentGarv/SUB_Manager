import { Reminder, NotificationPreferences } from '../models/types';
import { differenceInDays, format } from 'date-fns';

export class NotificationService {
  private scheduledNotifications: Map<string, number> = new Map();

  /**
   * Check if browser notifications are supported
   */
  checkNotificationSupport(): boolean {
    return 'Notification' in window;
  }

  /**
   * Request browser notification permission
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.checkNotificationSupport()) {
      return 'denied';
    }

    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  }

  /**
   * Send a browser notification for a reminder
   */
  sendBrowserNotification(reminder: Reminder): void {
    if (!this.checkNotificationSupport()) {
      console.warn('Browser notifications not supported');
      return;
    }

    if (Notification.permission !== 'granted') {
      console.warn('Notification permission not granted');
      return;
    }

    if (!reminder.notificationsEnabled) {
      return;
    }

    const daysUntilDue = differenceInDays(reminder.dueDate, new Date());
    const isOverdue = daysUntilDue < 0;
    
    let title: string;
    let body: string;

    if (isOverdue) {
      title = `⚠️ Overdue: ${reminder.name}`;
      body = `This reminder is ${Math.abs(daysUntilDue)} day(s) overdue. Amount: ${this.formatCurrency(reminder.amount, reminder.currency)}`;
    } else if (daysUntilDue === 0) {
      title = `🔔 Due Today: ${reminder.name}`;
      body = `This reminder is due today. Amount: ${this.formatCurrency(reminder.amount, reminder.currency)}`;
    } else {
      title = `📅 Upcoming: ${reminder.name}`;
      body = `Due in ${daysUntilDue} day(s) on ${format(reminder.dueDate, 'MMM d, yyyy')}. Amount: ${this.formatCurrency(reminder.amount, reminder.currency)}`;
    }

    try {
      const notification = new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: reminder.id,
        requireInteraction: isOverdue,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  /**
   * Schedule notifications for a reminder based on preferences
   */
  scheduleNotifications(reminder: Reminder, preferences: NotificationPreferences): void {
    if (!reminder.notificationsEnabled || !preferences.browserNotificationsEnabled) {
      return;
    }

    // Cancel any existing notifications for this reminder
    this.cancelNotifications(reminder.id);

    const now = new Date();
    const daysUntilDue = differenceInDays(reminder.dueDate, now);

    // Check each timing preference
    preferences.notificationTiming.forEach(timing => {
      let triggerDays: number;

      switch (timing) {
        case '1-day':
          triggerDays = 1;
          break;
        case '3-days':
          triggerDays = 3;
          break;
        case '1-week':
          triggerDays = 7;
          break;
        case 'custom':
          triggerDays = preferences.customTimingDays || 1;
          break;
      }

      // If we're within the notification window, send notification
      if (daysUntilDue <= triggerDays && daysUntilDue >= 0) {
        this.sendBrowserNotification(reminder);
      }
    });

    // Always send notification if overdue
    if (daysUntilDue < 0) {
      this.sendBrowserNotification(reminder);
    }
  }

  /**
   * Cancel scheduled notifications for a reminder
   */
  cancelNotifications(reminderId: string): void {
    const timeoutId = this.scheduledNotifications.get(reminderId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.scheduledNotifications.delete(reminderId);
    }
  }

  /**
   * Check all reminders and send notifications based on preferences
   */
  checkAndNotify(reminders: Reminder[], preferences: NotificationPreferences): void {
    if (!preferences.browserNotificationsEnabled) {
      return;
    }

    if (Notification.permission !== 'granted') {
      return;
    }

    reminders.forEach(reminder => {
      this.scheduleNotifications(reminder, preferences);
    });
  }

  /**
   * Format currency for display
   */
  private formatCurrency(amount: number, currency: string): string {
    const symbols: Record<string, string> = {
      USD: '$',
      EUR: '€',
      INR: '₹',
    };

    const symbol = symbols[currency] || currency;
    return `${symbol}${amount.toFixed(2)}`;
  }
}
