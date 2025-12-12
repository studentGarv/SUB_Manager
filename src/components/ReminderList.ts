import { differenceInDays, format } from 'date-fns';
import type { Reminder } from '../models/types';
import { ReminderService } from '../services/ReminderService';
import { AppState } from '../services/AppState';

export class ReminderList {
  private container: HTMLElement;
  private reminderService: ReminderService;
  private appState: AppState;
  private onEdit: (reminder: Reminder) => void;
  private onDelete: (id: string) => void;

  constructor(
    reminderService: ReminderService,
    appState: AppState,
    onEdit: (reminder: Reminder) => void,
    onDelete: (id: string) => void
  ) {
    this.reminderService = reminderService;
    this.appState = appState;
    this.onEdit = onEdit;
    this.onDelete = onDelete;
    this.container = document.getElementById('reminders-content') as HTMLElement;
  }

  render(reminders: Reminder[]): void {
    if (reminders.length === 0) {
      this.container.innerHTML = '<div class="empty-state">No reminders found. Create one to get started!</div>';
      return;
    }

    this.container.innerHTML = reminders.map(reminder => this.renderReminder(reminder)).join('');
    this.attachEventListeners();
  }

  private renderReminder(reminder: Reminder): string {
    const daysUntilDue = this.calculateDaysUntilDue(reminder.dueDate);
    const statusClass = this.getStatusClass(reminder, daysUntilDue);
    const statusText = this.getStatusText(daysUntilDue, reminder.status);

    return `
      <div class="reminder-item ${statusClass}" data-reminder-id="${reminder.id}">
        <div class="reminder-header">
          <h3 class="reminder-title">${this.escapeHtml(reminder.name)}</h3>
          <span class="reminder-amount">${this.formatCurrency(reminder.amount, reminder.currency)}</span>
        </div>
        
        <div class="reminder-details">
          <div class="reminder-detail">
            <span class="reminder-detail-label">Due Date</span>
            <span>${format(reminder.dueDate, 'MMM dd, yyyy')}</span>
          </div>
          <div class="reminder-detail">
            <span class="reminder-detail-label">Status</span>
            <span>${statusText}</span>
          </div>
          <div class="reminder-detail">
            <span class="reminder-detail-label">Category</span>
            <span>${this.formatCategory(reminder.category)}</span>
          </div>
          <div class="reminder-detail">
            <span class="reminder-detail-label">Recurrence</span>
            <span>${this.formatRecurrence(reminder.recurrence, reminder.customRecurrenceDays)}</span>
          </div>
        </div>

        ${reminder.notes ? `<div class="reminder-notes">${this.escapeHtml(reminder.notes)}</div>` : ''}

        ${this.renderCompletionHistory(reminder)}

        <div class="reminder-actions">
          <button class="btn btn-sm btn-success mark-complete-btn" data-id="${reminder.id}" aria-label="Mark ${this.escapeHtml(reminder.name)} as complete">
            Mark Complete
          </button>
          <button class="btn btn-sm btn-primary edit-btn" data-id="${reminder.id}" aria-label="Edit ${this.escapeHtml(reminder.name)}">
            Edit
          </button>
          <button class="btn btn-sm btn-danger delete-btn" data-id="${reminder.id}" aria-label="Delete ${this.escapeHtml(reminder.name)}">
            Delete
          </button>
        </div>
      </div>
    `;
  }

  private attachEventListeners(): void {
    // Edit buttons
    this.container.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = (e.target as HTMLElement).dataset.id!;
        const reminder = this.reminderService.getAllReminders().find(r => r.id === id);
        if (reminder) {
          this.onEdit(reminder);
        }
      });
    });

    // Delete buttons
    this.container.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = (e.target as HTMLElement).dataset.id!;
        this.onDelete(id);
      });
    });

    // Mark complete buttons
    this.container.querySelectorAll('.mark-complete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = (e.target as HTMLElement).dataset.id!;
        this.handleMarkComplete(id);
      });
    });
  }

  private handleMarkComplete(id: string): void {
    try {
      this.reminderService.markComplete(id);
      this.appState.setReminders(this.reminderService.getAllReminders());
    } catch (error) {
      console.error('Failed to mark reminder as complete', error);
    }
  }

  private calculateDaysUntilDue(dueDate: Date): number {
    return differenceInDays(dueDate, new Date());
  }

  private getStatusClass(reminder: Reminder, daysUntilDue: number): string {
    if (reminder.status === 'completed') {
      return 'completed';
    }
    if (daysUntilDue < 0) {
      return 'overdue';
    }
    if (daysUntilDue <= 7) {
      return 'upcoming';
    }
    return '';
  }

  private getStatusText(daysUntilDue: number, status: string): string {
    if (status === 'completed') {
      return 'Completed';
    }
    if (daysUntilDue < 0) {
      return `${Math.abs(daysUntilDue)} day${Math.abs(daysUntilDue) !== 1 ? 's' : ''} overdue`;
    }
    if (daysUntilDue === 0) {
      return 'Due today';
    }
    return `${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''} until due`;
  }

  private formatCategory(category: string): string {
    return category.charAt(0).toUpperCase() + category.slice(1);
  }

  private formatRecurrence(recurrence: string, customDays?: number): string {
    if (recurrence === 'custom' && customDays) {
      return `Every ${customDays} day${customDays !== 1 ? 's' : ''}`;
    }
    if (recurrence === 'semi-annually') {
      return 'Semi-annually';
    }
    return recurrence.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  private renderCompletionHistory(reminder: Reminder): string {
    if (reminder.completionHistory.length === 0) {
      return '';
    }

    const historyItems = reminder.completionHistory
      .slice(-5) // Show last 5 completions
      .reverse()
      .map(record => `
        <div style="font-size: 0.75rem; color: var(--text-secondary);">
          ✓ Completed on ${format(record.completedAt, 'MMM dd, yyyy')}
        </div>
      `)
      .join('');

    return `
      <div class="reminder-history" style="margin-top: var(--spacing-sm); padding: var(--spacing-sm); background-color: var(--bg-tertiary); border-radius: var(--border-radius);">
        <div style="font-weight: 500; margin-bottom: var(--spacing-xs); font-size: 0.875rem;">Completion History</div>
        ${historyItems}
        ${reminder.completionHistory.length > 5 ? `<div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: var(--spacing-xs);">... and ${reminder.completionHistory.length - 5} more</div>` : ''}
      </div>
    `;
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
