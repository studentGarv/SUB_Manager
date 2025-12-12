import { differenceInDays } from 'date-fns';
import type { Reminder } from '../models/types';
import { ReminderService } from '../services/ReminderService';
import { AppState } from '../services/AppState';

export class NotificationPanel {
  private container: HTMLElement;
  private reminderService: ReminderService;
  private appState: AppState;

  constructor(reminderService: ReminderService, appState: AppState) {
    this.reminderService = reminderService;
    this.appState = appState;
    this.container = document.getElementById('notifications-content') as HTMLElement;
  }

  render(): void {
    const upcomingReminders = this.reminderService.getUpcomingReminders(7);
    const overdueReminders = this.reminderService.getOverdueReminders();
    const state = this.appState.getState();
    
    // Filter out dismissed notifications
    const filteredUpcoming = upcomingReminders.filter(
      r => !state.dismissedNotifications.has(r.id)
    );
    const filteredOverdue = overdueReminders.filter(
      r => !state.dismissedNotifications.has(r.id)
    );

    if (filteredOverdue.length === 0 && filteredUpcoming.length === 0) {
      this.container.innerHTML = '<div class="empty-state">No notifications</div>';
      return;
    }

    let html = '';

    if (filteredOverdue.length > 0) {
      html += '<h3 style="color: var(--danger-color); margin-bottom: var(--spacing-md);">Overdue</h3>';
      html += filteredOverdue.map(r => this.renderNotification(r, true)).join('');
    }

    if (filteredUpcoming.length > 0) {
      html += '<h3 style="color: var(--warning-color); margin-bottom: var(--spacing-md); margin-top: var(--spacing-lg);">Upcoming</h3>';
      html += filteredUpcoming.map(r => this.renderNotification(r, false)).join('');
    }

    this.container.innerHTML = html;
    this.attachEventListeners();
  }

  private renderNotification(reminder: Reminder, isOverdue: boolean): string {
    const daysUntilDue = differenceInDays(reminder.dueDate, new Date());
    const statusText = isOverdue 
      ? `${Math.abs(daysUntilDue)} day${Math.abs(daysUntilDue) !== 1 ? 's' : ''} overdue`
      : `Due in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}`;

    return `
      <div class="notification-item ${isOverdue ? 'overdue' : ''}" data-reminder-id="${reminder.id}">
        <div class="notification-content">
          <div class="notification-title">${this.escapeHtml(reminder.name)}</div>
          <div class="notification-meta">
            ${this.formatCurrency(reminder.amount, reminder.currency)} • ${statusText}
          </div>
        </div>
        <button class="btn btn-sm btn-secondary dismiss-btn" data-id="${reminder.id}" aria-label="Dismiss notification">
          Dismiss
        </button>
      </div>
    `;
  }

  private attachEventListeners(): void {
    this.container.querySelectorAll('.dismiss-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = (e.target as HTMLElement).dataset.id!;
        this.handleDismiss(id);
      });
    });
  }

  private handleDismiss(reminderId: string): void {
    this.appState.dismissNotification(reminderId);
  }

  private formatCurrency(amount: number, currency: string): string {
    const symbols: { [key: string]: string } = {
      'USD': '$',
      'EUR': '€',
      'INR': '₹'
    };
    const symbol = symbols[currency] || '$';
    return `${symbol}${amount.toFixed(2)}`;
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
