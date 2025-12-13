import { NotificationPreferences, NotificationTiming } from '../models/types';
import { StorageService } from '../services/StorageService';
import { NotificationService } from '../services/NotificationService';

export class NotificationSettings {
  private container: HTMLElement;
  private storageService: StorageService;
  private notificationService: NotificationService;
  private preferences: NotificationPreferences;
  private onPreferencesChange: (prefs: NotificationPreferences) => void;

  constructor(
    storageService: StorageService,
    notificationService: NotificationService,
    onPreferencesChange: (prefs: NotificationPreferences) => void
  ) {
    this.storageService = storageService;
    this.notificationService = notificationService;
    this.onPreferencesChange = onPreferencesChange;
    
    const container = document.getElementById('notification-settings-content');
    if (!container) {
      throw new Error('Notification settings container not found');
    }
    this.container = container;

    // Load preferences
    this.preferences = this.storageService.getNotificationPreferences() || {
      browserNotificationsEnabled: false,
      notificationTiming: ['1-day'],
      autoGenerateCalendarLinks: false,
    };

    this.render();
    this.attachEventListeners();
  }

  render(): void {
    const notificationSupported = this.notificationService.checkNotificationSupport();
    const notificationPermission = notificationSupported ? Notification.permission : 'denied';

    this.container.innerHTML = `
      <div class="settings-section">
        <h3>Browser Notifications</h3>
        
        ${!notificationSupported ? `
          <div class="info-message">
            ⚠️ Browser notifications are not supported in your browser.
          </div>
        ` : ''}
        
        ${notificationSupported && notificationPermission === 'denied' ? `
          <div class="info-message">
            ⚠️ Notification permission has been denied. Please enable notifications in your browser settings.
          </div>
        ` : ''}
        
        <div class="setting-item">
          <label class="checkbox-label">
            <input 
              type="checkbox" 
              id="browser-notifications-toggle"
              ${this.preferences.browserNotificationsEnabled ? 'checked' : ''}
              ${!notificationSupported ? 'disabled' : ''}
            />
            <span>Enable browser notifications</span>
          </label>
          <p class="setting-description">
            Receive system notifications for upcoming and overdue reminders
          </p>
        </div>
      </div>

      <div class="settings-section ${!this.preferences.browserNotificationsEnabled ? 'disabled' : ''}">
        <h3>Notification Timing</h3>
        <p class="setting-description">Choose when to receive notifications before due dates</p>
        
        <div class="setting-item">
          <label class="checkbox-label">
            <input 
              type="checkbox" 
              class="timing-checkbox"
              data-timing="1-day"
              ${this.preferences.notificationTiming.includes('1-day') ? 'checked' : ''}
              ${!this.preferences.browserNotificationsEnabled ? 'disabled' : ''}
            />
            <span>1 day before</span>
          </label>
        </div>

        <div class="setting-item">
          <label class="checkbox-label">
            <input 
              type="checkbox" 
              class="timing-checkbox"
              data-timing="3-days"
              ${this.preferences.notificationTiming.includes('3-days') ? 'checked' : ''}
              ${!this.preferences.browserNotificationsEnabled ? 'disabled' : ''}
            />
            <span>3 days before</span>
          </label>
        </div>

        <div class="setting-item">
          <label class="checkbox-label">
            <input 
              type="checkbox" 
              class="timing-checkbox"
              data-timing="1-week"
              ${this.preferences.notificationTiming.includes('1-week') ? 'checked' : ''}
              ${!this.preferences.browserNotificationsEnabled ? 'disabled' : ''}
            />
            <span>1 week before</span>
          </label>
        </div>

        <div class="setting-item">
          <label class="checkbox-label">
            <input 
              type="checkbox" 
              class="timing-checkbox"
              data-timing="custom"
              ${this.preferences.notificationTiming.includes('custom') ? 'checked' : ''}
              ${!this.preferences.browserNotificationsEnabled ? 'disabled' : ''}
            />
            <span>Custom</span>
          </label>
          <div class="custom-timing-input ${this.preferences.notificationTiming.includes('custom') ? '' : 'hidden'}">
            <input 
              type="number" 
              id="custom-timing-days"
              min="1"
              max="365"
              value="${this.preferences.customTimingDays || 1}"
              ${!this.preferences.browserNotificationsEnabled || !this.preferences.notificationTiming.includes('custom') ? 'disabled' : ''}
            />
            <span>days before</span>
          </div>
        </div>
      </div>

      <div class="settings-section">
        <h3>Calendar Integration</h3>
        
        <div class="setting-item">
          <label class="checkbox-label">
            <input 
              type="checkbox" 
              id="auto-calendar-links-toggle"
              ${this.preferences.autoGenerateCalendarLinks ? 'checked' : ''}
            />
            <span>Automatically show Google Calendar links</span>
          </label>
          <p class="setting-description">
            Display "Add to Google Calendar" button for all reminders
          </p>
        </div>
      </div>
    `;
  }

  private attachEventListeners(): void {
    // Browser notifications toggle
    const browserNotificationsToggle = this.container.querySelector('#browser-notifications-toggle') as HTMLInputElement;
    if (browserNotificationsToggle) {
      browserNotificationsToggle.addEventListener('change', async (e) => {
        const enabled = (e.target as HTMLInputElement).checked;
        
        if (enabled) {
          const permission = await this.notificationService.requestPermission();
          if (permission !== 'granted') {
            (e.target as HTMLInputElement).checked = false;
            alert('Notification permission was denied. Please enable notifications in your browser settings.');
            return;
          }
        }

        this.preferences.browserNotificationsEnabled = enabled;
        this.savePreferences();
        this.render();
        this.attachEventListeners();
      });
    }

    // Timing checkboxes
    const timingCheckboxes = this.container.querySelectorAll('.timing-checkbox');
    timingCheckboxes.forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        const timing = target.dataset.timing as NotificationTiming;
        
        if (target.checked) {
          if (!this.preferences.notificationTiming.includes(timing)) {
            this.preferences.notificationTiming.push(timing);
          }
        } else {
          this.preferences.notificationTiming = this.preferences.notificationTiming.filter(t => t !== timing);
        }

        this.savePreferences();
        this.render();
        this.attachEventListeners();
      });
    });

    // Custom timing days input
    const customTimingInput = this.container.querySelector('#custom-timing-days') as HTMLInputElement;
    if (customTimingInput) {
      customTimingInput.addEventListener('change', (e) => {
        const days = parseInt((e.target as HTMLInputElement).value, 10);
        if (days > 0) {
          this.preferences.customTimingDays = days;
          this.savePreferences();
        }
      });
    }

    // Auto calendar links toggle
    const autoCalendarToggle = this.container.querySelector('#auto-calendar-links-toggle') as HTMLInputElement;
    if (autoCalendarToggle) {
      autoCalendarToggle.addEventListener('change', (e) => {
        this.preferences.autoGenerateCalendarLinks = (e.target as HTMLInputElement).checked;
        this.savePreferences();
      });
    }
  }

  private savePreferences(): void {
    this.storageService.saveNotificationPreferences(this.preferences);
    this.onPreferencesChange(this.preferences);
  }

  getPreferences(): NotificationPreferences {
    return this.preferences;
  }
}
