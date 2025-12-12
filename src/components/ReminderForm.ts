import type { ReminderInput, Reminder } from '../models/types';
import { ReminderService } from '../services/ReminderService';
import { AppState } from '../services/AppState';

export class ReminderForm {
  private form: HTMLFormElement;
  private reminderService: ReminderService;
  private appState: AppState;
  private editingReminder: Reminder | null = null;

  constructor(reminderService: ReminderService, appState: AppState) {
    this.reminderService = reminderService;
    this.appState = appState;
    this.form = document.getElementById('reminder-form') as HTMLFormElement;
    
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    
    const cancelBtn = document.getElementById('cancel-btn');
    cancelBtn?.addEventListener('click', () => this.handleCancel());

    // Show/hide custom recurrence field
    const recurrenceSelect = document.getElementById('reminder-recurrence') as HTMLSelectElement;
    recurrenceSelect?.addEventListener('change', () => this.toggleCustomRecurrence());
  }

  private toggleCustomRecurrence(): void {
    const recurrenceSelect = document.getElementById('reminder-recurrence') as HTMLSelectElement;
    const customGroup = document.getElementById('custom-recurrence-group') as HTMLElement;
    const customInput = document.getElementById('reminder-custom-days') as HTMLInputElement;

    if (recurrenceSelect.value === 'custom') {
      customGroup.style.display = 'block';
      customInput.required = true;
    } else {
      customGroup.style.display = 'none';
      customInput.required = false;
      customInput.value = '';
    }
  }

  private handleSubmit(e: Event): void {
    e.preventDefault();
    
    this.clearErrors();

    const formData = new FormData(this.form);
    const recurrence = formData.get('recurrence') as any;
    const data: ReminderInput = {
      name: formData.get('name') as string,
      amount: parseFloat(formData.get('amount') as string),
      currency: formData.get('currency') as any,
      dueDate: formData.get('dueDate') as string,
      category: formData.get('category') as any,
      recurrence: recurrence,
      notes: formData.get('notes') as string || undefined,
    };

    // Add custom recurrence days if applicable
    if (recurrence === 'custom') {
      const customDays = formData.get('customRecurrenceDays');
      data.customRecurrenceDays = customDays ? parseInt(customDays as string) : undefined;
    }

    try {
      if (this.editingReminder) {
        this.reminderService.updateReminder(this.editingReminder.id, data);
      } else {
        this.reminderService.createReminder(data);
      }

      this.clearForm();
      this.appState.setReminders(this.reminderService.getAllReminders());
      this.appState.setEditingReminder(null);
    } catch (error) {
      if (error instanceof Error) {
        this.displayErrors(error.message);
      }
    }
  }

  private handleCancel(): void {
    this.clearForm();
    this.appState.setEditingReminder(null);
  }

  populateForm(reminder: Reminder): void {
    this.editingReminder = reminder;
    
    const formTitle = document.getElementById('form-title');
    if (formTitle) {
      formTitle.textContent = 'Edit Reminder';
    }

    (document.getElementById('reminder-name') as HTMLInputElement).value = reminder.name;
    (document.getElementById('reminder-amount') as HTMLInputElement).value = reminder.amount.toString();
    (document.getElementById('reminder-currency') as HTMLSelectElement).value = reminder.currency || 'USD';
    (document.getElementById('reminder-due-date') as HTMLInputElement).value = 
      reminder.dueDate.toISOString().split('T')[0];
    (document.getElementById('reminder-category') as HTMLSelectElement).value = reminder.category;
    (document.getElementById('reminder-recurrence') as HTMLSelectElement).value = reminder.recurrence;
    (document.getElementById('reminder-notes') as HTMLTextAreaElement).value = reminder.notes || '';

    // Handle custom recurrence
    if (reminder.recurrence === 'custom' && reminder.customRecurrenceDays) {
      (document.getElementById('reminder-custom-days') as HTMLInputElement).value = reminder.customRecurrenceDays.toString();
    }
    this.toggleCustomRecurrence();

    const cancelBtn = document.getElementById('cancel-btn') as HTMLButtonElement;
    cancelBtn.style.display = 'inline-block';
  }

  clearForm(): void {
    this.form.reset();
    this.editingReminder = null;
    this.clearErrors();
    
    const formTitle = document.getElementById('form-title');
    if (formTitle) {
      formTitle.textContent = 'Add New Reminder';
    }

    const cancelBtn = document.getElementById('cancel-btn') as HTMLButtonElement;
    cancelBtn.style.display = 'none';

    // Focus on first input
    const firstInput = document.getElementById('reminder-name') as HTMLInputElement;
    firstInput?.focus();
  }

  private clearErrors(): void {
    const errorElements = this.form.querySelectorAll('.error-message');
    errorElements.forEach(el => {
      el.textContent = '';
    });
  }

  private displayErrors(message: string): void {
    // Parse validation errors from message
    const errors = message.replace('Validation failed: ', '').split(', ');
    
    errors.forEach(error => {
      if (error.includes('Name')) {
        this.showFieldError('name', error);
      } else if (error.includes('Amount') || error.includes('amount')) {
        this.showFieldError('amount', error);
      } else if (error.includes('date') || error.includes('Date')) {
        this.showFieldError('dueDate', error);
      } else if (error.includes('Category')) {
        this.showFieldError('category', error);
      } else if (error.includes('custom') || error.includes('days')) {
        this.showFieldError('customRecurrenceDays', error);
      }
    });
  }

  private showFieldError(field: string, message: string): void {
    const errorElement = document.getElementById(`${field}-error`);
    if (errorElement) {
      errorElement.textContent = message;
    }
  }
}
