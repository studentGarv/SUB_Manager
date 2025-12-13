import { ReminderService } from './services/ReminderService';
import { AppState } from './services/AppState';
import { StorageService } from './services/StorageService';
import { NotificationService } from './services/NotificationService';
import { ReminderForm } from './components/ReminderForm';
import { ReminderList } from './components/ReminderList';
import { NotificationPanel } from './components/NotificationPanel';
import { NotificationSettings } from './components/NotificationSettings';
import { FilterBar } from './components/FilterBar';
import { ErrorHandler } from './utils/errorHandler';
import { ThemeManager } from './utils/ThemeManager';
import type { Reminder, NotificationPreferences } from './models/types';

class App {
  private reminderService: ReminderService;
  private storageService: StorageService;
  private notificationService: NotificationService;
  private appState: AppState;
  private reminderForm: ReminderForm;
  private reminderList: ReminderList;
  private notificationPanel: NotificationPanel;
  private notificationSettings: NotificationSettings | null = null;
  private deleteModal: HTMLElement;
  private settingsModal: HTMLElement;
  private pendingDeleteId: string | null = null;
  private notificationCheckInterval: number | null = null;

  constructor() {
    this.reminderService = new ReminderService();
    this.storageService = new StorageService();
    this.notificationService = new NotificationService();
    this.appState = new AppState();

    // Initialize theme
    new ThemeManager();

    // Initialize components
    this.reminderForm = new ReminderForm(this.reminderService, this.appState);
    this.reminderList = new ReminderList(
      this.reminderService,
      this.appState,
      (reminder) => this.handleEdit(reminder),
      (id) => this.showDeleteConfirmation(id)
    );
    this.notificationPanel = new NotificationPanel(this.reminderService, this.appState);
    new FilterBar(this.appState);

    this.deleteModal = document.getElementById('delete-modal') as HTMLElement;
    this.settingsModal = document.getElementById('settings-modal') as HTMLElement;

    this.setupDeleteModal();
    this.setupSettingsModal();
    this.setupMobileNotifications();
    this.setupStateSubscription();
    this.loadInitialData();
    this.startNotificationScheduler();
  }

  private setupDeleteModal(): void {
    const confirmBtn = document.getElementById('confirm-delete-btn');
    const cancelBtn = document.getElementById('cancel-delete-btn');

    confirmBtn?.addEventListener('click', () => this.confirmDelete());
    cancelBtn?.addEventListener('click', () => this.cancelDelete());

    // Close modal on background click
    this.deleteModal.addEventListener('click', (e) => {
      if (e.target === this.deleteModal) {
        this.cancelDelete();
      }
    });
  }

  private setupSettingsModal(): void {
    const settingsBtn = document.getElementById('settings-btn');
    const closeBtn = document.getElementById('close-settings-btn');
    const saveBtn = document.getElementById('save-settings-btn');

    settingsBtn?.addEventListener('click', () => this.openSettings());
    closeBtn?.addEventListener('click', () => this.closeSettings());
    saveBtn?.addEventListener('click', () => this.closeSettings());

    // Close modal on background click
    this.settingsModal.addEventListener('click', (e) => {
      if (e.target === this.settingsModal) {
        this.closeSettings();
      }
    });
  }

  private openSettings(): void {
    if (!this.notificationSettings) {
      this.notificationSettings = new NotificationSettings(
        this.storageService,
        this.notificationService,
        (prefs) => this.handlePreferencesChange(prefs)
      );
    }
    this.settingsModal.classList.add('active');
  }

  private closeSettings(): void {
    this.settingsModal.classList.remove('active');
  }

  private handlePreferencesChange(preferences: NotificationPreferences): void {
    // Update app state with new preferences
    this.appState.setNotificationPreferences(preferences);
    
    // Restart notification scheduler with new preferences
    this.startNotificationScheduler();
    
    // Update calendar link visibility
    this.reminderList.setShowCalendarLinks(preferences.autoGenerateCalendarLinks);
    this.render();
  }

  private startNotificationScheduler(): void {
    // Clear existing interval
    if (this.notificationCheckInterval) {
      clearInterval(this.notificationCheckInterval);
    }

    const preferences = this.storageService.getNotificationPreferences();
    if (!preferences || !preferences.browserNotificationsEnabled) {
      return;
    }

    // Check if we have permission
    if (this.notificationService.checkNotificationSupport() && Notification.permission !== 'granted') {
      console.warn('Notification permission not granted. Notifications will not be sent.');
      return;
    }

    // Check notifications immediately
    this.checkNotifications();

    // Check every hour
    this.notificationCheckInterval = window.setInterval(() => {
      this.checkNotifications();
    }, 60 * 60 * 1000); // 1 hour
  }

  private checkNotifications(): void {
    const preferences = this.storageService.getNotificationPreferences();
    if (!preferences) {
      return;
    }

    const reminders = this.reminderService.getAllReminders();
    this.notificationService.checkAndNotify(reminders, preferences);
  }

  private setupMobileNotifications(): void {
    const toggleBtn = document.getElementById('mobile-notification-toggle');
    const panel = document.getElementById('notifications-panel');
    const bellIcon = toggleBtn?.querySelector('.notification-icon') as HTMLElement;
    const closeIcon = toggleBtn?.querySelector('.notification-close-icon') as HTMLElement;

    let isOpen = false;

    const togglePanel = () => {
      isOpen = !isOpen;

      if (isOpen) {
        // Open panel
        panel?.classList.add('mobile-open');
        toggleBtn?.classList.add('panel-open');
        document.body.style.overflow = 'hidden';
        
        // Switch icons
        if (bellIcon) bellIcon.style.display = 'none';
        if (closeIcon) closeIcon.style.display = 'flex';
      } else {
        // Close panel
        panel?.classList.remove('mobile-open');
        toggleBtn?.classList.remove('panel-open');
        document.body.style.overflow = '';
        
        // Switch icons back
        if (bellIcon) bellIcon.style.display = 'flex';
        if (closeIcon) closeIcon.style.display = 'none';
      }
    };

    toggleBtn?.addEventListener('click', togglePanel);
  }

  private setupStateSubscription(): void {
    this.appState.subscribe(() => {
      this.render();
    });
  }

  private loadInitialData(): void {
    const reminders = this.reminderService.getAllReminders();
    this.appState.setReminders(reminders);
    
    // Load notification preferences from storage
    const preferences = this.storageService.getNotificationPreferences();
    if (preferences) {
      this.appState.setNotificationPreferences(preferences);
      this.reminderList.setShowCalendarLinks(preferences.autoGenerateCalendarLinks);
    } else {
      // Set default preferences
      const defaultPreferences: NotificationPreferences = {
        browserNotificationsEnabled: false,
        notificationTiming: ['1-day'],
        autoGenerateCalendarLinks: false,
      };
      this.appState.setNotificationPreferences(defaultPreferences);
    }
  }

  private render(): void {
    const state = this.appState.getState();
    
    // Apply filters
    let reminders = state.reminders;
    if (Object.keys(state.filters).length > 0) {
      reminders = this.reminderService.filterReminders(state.filters);
    }

    // Render components
    this.reminderList.render(reminders);
    this.notificationPanel.render();

    // Update notification badge
    this.updateNotificationBadge();

    // Handle editing state
    if (state.editingReminderId) {
      const reminder = reminders.find(r => r.id === state.editingReminderId);
      if (reminder) {
        this.reminderForm.populateForm(reminder);
        this.scrollToForm();
      }
    }
  }

  private updateNotificationBadge(): void {
    const upcomingCount = this.reminderService.getUpcomingReminders(7).length;
    const overdueCount = this.reminderService.getOverdueReminders().length;
    const totalCount = upcomingCount + overdueCount;

    const badge = document.getElementById('notification-badge');
    if (badge) {
      if (totalCount > 0) {
        badge.textContent = totalCount.toString();
        badge.style.display = 'flex';
      } else {
        badge.style.display = 'none';
      }
    }
  }

  private handleEdit(reminder: Reminder): void {
    this.appState.setEditingReminder(reminder.id);
  }

  private showDeleteConfirmation(id: string): void {
    this.pendingDeleteId = id;
    this.deleteModal.classList.add('active');
  }

  private confirmDelete(): void {
    if (this.pendingDeleteId) {
      try {
        this.reminderService.deleteReminder(this.pendingDeleteId);
        this.appState.setReminders(this.reminderService.getAllReminders());
        this.pendingDeleteId = null;
        this.deleteModal.classList.remove('active');
      } catch (error) {
        ErrorHandler.logError('Delete Reminder', error);
      }
    }
  }

  private cancelDelete(): void {
    this.pendingDeleteId = null;
    this.deleteModal.classList.remove('active');
  }

  private scrollToForm(): void {
    const formSection = document.getElementById('reminder-form-section');
    formSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new App();
});
