import type { Reminder, RecurrencePattern } from '../models/types';
import { format } from 'date-fns';

export class CalendarIntegration {
  /**
   * Generates a Google Calendar URL with pre-filled reminder details
   * @param reminder The reminder to add to Google Calendar
   * @returns A formatted Google Calendar URL
   */
  static generateGoogleCalendarUrl(reminder: Reminder): string {
    const baseUrl = 'https://calendar.google.com/calendar/render';
    const params = new URLSearchParams();

    params.append('action', 'TEMPLATE');
    
    // Title (reminder name)
    params.append('text', reminder.name);
    
    // Dates in ISO 8601 format (YYYYMMDDTHHMMSSZ)
    const startDate = this.formatDateForGoogleCalendar(reminder.dueDate);
    const endDate = this.formatDateForGoogleCalendar(reminder.dueDate);
    params.append('dates', `${startDate}/${endDate}`);
    
    // Description (amount, currency, and notes)
    const description = this.buildDescription(reminder);
    params.append('details', description);
    
    // Recurrence rule
    if (reminder.recurrence !== 'one-time') {
      const rrule = this.formatRecurrenceForGoogleCalendar(
        reminder.recurrence,
        reminder.customRecurrenceDays
      );
      params.append('recur', rrule);
    }

    return `${baseUrl}?${params.toString()}`;
  }

  /**
   * Opens a Google Calendar link in a new tab
   * @param reminder The reminder to add to Google Calendar
   */
  static openCalendarLink(reminder: Reminder): void {
    const url = this.generateGoogleCalendarUrl(reminder);
    const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
    
    // Handle popup blockers gracefully
    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      // Popup was blocked, log to console only
      console.warn('Popup blocked. Please allow popups for this site to add events to Google Calendar.');
    }
  }

  /**
   * Converts a recurrence pattern to Google Calendar RRULE format
   * @param recurrence The recurrence pattern
   * @param customDays Optional custom interval in days
   * @returns RRULE string for Google Calendar
   */
  static formatRecurrenceForGoogleCalendar(
    recurrence: RecurrencePattern,
    customDays?: number
  ): string {
    switch (recurrence) {
      case 'monthly':
        return 'RRULE:FREQ=MONTHLY';
      case 'quarterly':
        return 'RRULE:FREQ=MONTHLY;INTERVAL=3';
      case 'semi-annually':
        return 'RRULE:FREQ=MONTHLY;INTERVAL=6';
      case 'annually':
        return 'RRULE:FREQ=YEARLY';
      case 'custom':
        if (customDays) {
          return `RRULE:FREQ=DAILY;INTERVAL=${customDays}`;
        }
        return 'RRULE:FREQ=DAILY;INTERVAL=1';
      case 'one-time':
      default:
        return '';
    }
  }

  /**
   * Formats a date for Google Calendar in ISO 8601 format (YYYYMMDDTHHMMSSZ)
   * @param date The date to format
   * @returns Formatted date string
   */
  private static formatDateForGoogleCalendar(date: Date): string {
    // Format as YYYYMMDDTHHMMSSZ (all-day event at midnight UTC)
    return format(date, "yyyyMMdd'T'HHmmss'Z'");
  }

  /**
   * Builds the description field for Google Calendar
   * @param reminder The reminder
   * @returns Formatted description string
   */
  private static buildDescription(reminder: Reminder): string {
    const currencySymbols: { [key: string]: string } = {
      'USD': '$',
      'EUR': '€',
      'INR': '₹'
    };
    
    const symbol = currencySymbols[reminder.currency] || '$';
    let description = `Amount: ${symbol}${reminder.amount.toFixed(2)}`;
    
    if (reminder.notes) {
      description += `\n\nNotes: ${reminder.notes}`;
    }
    
    description += `\n\nCategory: ${reminder.category}`;
    
    return description;
  }
}
