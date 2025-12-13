# Design Document

## Overview

The Reminder Manager is a client-side web application built with modern web technologies. It provides a clean, intuitive interface for managing recurring financial reminders. The application uses browser local storage for data persistence, ensuring user data remains private and accessible offline. The architecture follows a component-based approach with clear separation between UI, business logic, and data storage layers.

## Architecture

The application follows a layered architecture:

1. **Presentation Layer**: HTML/CSS/JavaScript UI components that handle user interactions and display
2. **Business Logic Layer**: Core reminder management logic including validation, recurrence calculation, and notification logic
3. **Data Access Layer**: Local storage interface for persisting and retrieving reminder data
4. **State Management**: Centralized state management for reactive UI updates

The application is a Single Page Application (SPA) that runs entirely in the browser without requiring a backend server.

## Components and Interfaces

### UI Components

**ReminderForm Component**
- Purpose: Create and edit reminders
- Inputs: Reminder data (name, amount, currency, due date, category, recurrence, custom interval, notes)
- Outputs: Validated reminder object
- Responsibilities: Form validation, user input handling, date selection, currency selection, custom recurrence interval input with conditional visibility

**ReminderList Component**
- Purpose: Display all reminders in a sortable list
- Inputs: Array of reminder objects, filter criteria
- Outputs: User actions (edit, delete, mark complete)
- Responsibilities: Rendering reminders, sorting, filtering, visual status indicators

**NotificationPanel Component**
- Purpose: Display upcoming and overdue reminders
- Inputs: Array of reminders, current date
- Outputs: Dismissed notification events
- Responsibilities: Calculate days until due, highlight overdue items, dismissal handling

**FilterBar Component**
- Purpose: Provide search and category filtering
- Inputs: User search text, selected category
- Outputs: Filter criteria object
- Responsibilities: Search input handling, category selection, filter state management

**ThemeManager Utility**
- Purpose: Manage application theme (light/dark mode)
- Inputs: User theme preference, system theme preference
- Outputs: Theme changes applied to DOM
- Responsibilities: Detect system theme using prefers-color-scheme, toggle theme on button click, persist theme preference to localStorage, apply theme via data-theme attribute, update theme icon

**NotificationSettings Component**
- Purpose: Configure notification preferences
- Inputs: User notification preferences (browser notifications enabled, notification timing, per-reminder notification settings)
- Outputs: Updated notification preferences
- Responsibilities: Display notification settings UI, handle browser notification permission requests, manage notification timing preferences, allow disabling notifications per reminder

**CalendarIntegration Utility**
- Purpose: Generate Google Calendar URLs for reminders
- Inputs: Reminder data (name, due date, amount, recurrence, notes)
- Outputs: Google Calendar URL with pre-filled event details
- Responsibilities: Format reminder data into Google Calendar URL parameters, handle recurrence pattern conversion to Google Calendar format, generate shareable calendar links

### Business Logic Modules

**ReminderService**
```typescript
interface ReminderService {
  createReminder(data: ReminderInput): Reminder
  updateReminder(id: string, data: Partial<ReminderInput>): Reminder
  deleteReminder(id: string): void
  markComplete(id: string): Reminder
  getAllReminders(): Reminder[]
  getUpcomingReminders(daysAhead: number): Reminder[]
  getOverdueReminders(): Reminder[]
  filterReminders(criteria: FilterCriteria): Reminder[]
}
```

**RecurrenceCalculator**
```typescript
interface RecurrenceCalculator {
  calculateNextOccurrence(reminder: Reminder): Date
  generateOccurrences(reminder: Reminder, count: number): Date[]
}
```

**ValidationService**
```typescript
interface ValidationService {
  validateReminderInput(data: ReminderInput): ValidationResult
  validateDate(date: string): boolean
  validateAmount(amount: number): boolean
}
```

**NotificationService**
```typescript
interface NotificationService {
  requestPermission(): Promise<NotificationPermission>
  sendBrowserNotification(reminder: Reminder): void
  scheduleNotifications(reminder: Reminder, preferences: NotificationPreferences): void
  cancelNotifications(reminderId: string): void
  checkNotificationSupport(): boolean
}
```

**CalendarIntegration**
```typescript
interface CalendarIntegration {
  generateGoogleCalendarUrl(reminder: Reminder): string
  openCalendarLink(reminder: Reminder): void
  formatRecurrenceForGoogleCalendar(recurrence: RecurrencePattern, customDays?: number): string
}
```

### Data Access Layer

**StorageService**
```typescript
interface StorageService {
  saveReminder(reminder: Reminder): void
  getReminder(id: string): Reminder | null
  getAllReminders(): Reminder[]
  updateReminder(id: string, reminder: Reminder): void
  deleteReminder(id: string): void
  saveNotificationPreferences(preferences: NotificationPreferences): void
  getNotificationPreferences(): NotificationPreferences | null
  // Theme preference is stored directly via localStorage in ThemeManager
}
```

**ThemeManager**
```typescript
class ThemeManager {
  private static STORAGE_KEY = 'reminder-manager-theme'
  constructor() // Initializes theme from storage or system preference
  private loadTheme(): void
  private toggleTheme(): void
  private applyTheme(theme: string): void
}
```

## Data Models

### Reminder
```typescript
interface Reminder {
  id: string                    // Unique identifier (UUID)
  name: string                  // Reminder name/description
  amount: number                // Payment amount
  currency: Currency            // Currency for the amount
  dueDate: Date                 // Next due date
  category: ReminderCategory    // Classification
  recurrence: RecurrencePattern // Repeat pattern
  customRecurrenceDays?: number // Number of days for custom recurrence (only when recurrence is 'custom')
  notes?: string                // Optional user notes
  status: ReminderStatus        // Current status
  completionHistory: CompletionRecord[]  // Past completions
  notificationsEnabled: boolean // Whether notifications are enabled for this reminder
  createdAt: Date              // Creation timestamp
  updatedAt: Date              // Last modification timestamp
}

type ReminderCategory = 'subscription' | 'tax' | 'insurance' | 'utility' | 'other'

type RecurrencePattern = 'one-time' | 'monthly' | 'quarterly' | 'semi-annually' | 'annually' | 'custom'

type Currency = 'USD' | 'EUR' | 'INR'

type ReminderStatus = 'active' | 'completed' | 'overdue'

interface CompletionRecord {
  completedAt: Date
  originalDueDate: Date
}

interface ReminderInput {
  name: string
  amount: number
  currency: Currency
  dueDate: string
  category: ReminderCategory
  recurrence: RecurrencePattern
  customRecurrenceDays?: number
  notes?: string
}

interface FilterCriteria {
  searchText?: string
  category?: ReminderCategory
  status?: ReminderStatus
}

interface ValidationResult {
  isValid: boolean
  errors: { field: string; message: string }[]
}

interface NotificationPreferences {
  browserNotificationsEnabled: boolean
  notificationTiming: NotificationTiming[]  // When to send notifications (e.g., 1 day before, 3 days before)
  autoGenerateCalendarLinks: boolean        // Automatically show calendar links for new reminders
}

type NotificationTiming = '1-day' | '3-days' | '1-week' | 'custom'

interface CustomNotificationTiming {
  days: number  // Number of days before due date
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Reminder creation and persistence round-trip
*For any* valid reminder input data (name, amount, currency, due date, category, recurrence, optional notes), creating a reminder and then retrieving it from storage should return a reminder with all the same field values.
**Validates: Requirements 1.1, 1.5, 1.6**

### Property 2: Recurrence pattern calculation correctness
*For any* reminder with a recurrence pattern (monthly, quarterly, semi-annually, annually), calculating the next occurrence from a given due date should advance the date by exactly the period specified by the pattern (1 month, 3 months, 6 months, or 12 months respectively).
**Validates: Requirements 1.2**

### Property 3: Validation rejects incomplete input
*For any* reminder input data with one or more required fields missing (name, amount, due date, or category), validation should fail and return error messages identifying each missing field.
**Validates: Requirements 1.4**

### Property 4: Reminder list sorting by due date
*For any* collection of reminders, retrieving the active reminders list should return them ordered by due date in ascending order (earliest first).
**Validates: Requirements 2.1**

### Property 5: Rendered reminders contain required information
*For any* reminder, the rendered output should contain the reminder's name, amount, due date, category, and calculated days until due (or days overdue).
**Validates: Requirements 2.2, 6.3**

### Property 6: Status-based visual distinction
*For any* reminder, the rendered output should include different visual indicators (CSS classes or attributes) based on its status (overdue, upcoming, completed), ensuring each status is visually distinguishable.
**Validates: Requirements 2.3, 5.3, 6.2**

### Property 7: UI state reactivity
*For any* change to the reminder data (create, update, delete, complete), the UI state should update to reflect the change without requiring manual refresh.
**Validates: Requirements 2.5**

### Property 8: Edit form pre-population
*For any* existing reminder, triggering the edit action should populate the form fields with the reminder's current values.
**Validates: Requirements 3.1**

### Property 9: Update persistence
*For any* existing reminder and any valid field modifications, saving the update should result in the stored reminder reflecting all the new values.
**Validates: Requirements 3.2**

### Property 10: Edit cancellation preserves original
*For any* reminder being edited, making changes and then canceling should leave the stored reminder unchanged from its original state.
**Validates: Requirements 3.3**

### Property 11: Update preserves completion history
*For any* recurring reminder with completion history, updating the reminder's details should preserve all existing completion records.
**Validates: Requirements 3.4**

### Property 12: Deletion removes from storage
*For any* reminder, confirming deletion should result in the reminder no longer existing in storage and no longer appearing in any displayed lists.
**Validates: Requirements 4.2, 4.4**

### Property 13: Deletion cancellation preserves reminder
*For any* reminder, triggering delete and then canceling should leave the reminder unchanged in storage.
**Validates: Requirements 4.3**

### Property 14: Completion records tracking
*For any* reminder, marking it as completed should add a completion record with the current date and update the reminder's status.
**Validates: Requirements 5.1**

### Property 15: Recurring reminder advancement
*For any* recurring reminder (monthly, quarterly, semi-annually, annually, custom), marking it as completed should advance the due date by exactly one period according to its recurrence pattern.
**Validates: Requirements 5.2**

### Property 16: Completion history display
*For any* reminder with completion records, displaying the history should show all completion records with their dates.
**Validates: Requirements 5.4**

### Property 17: Upcoming notifications filtering
*For any* collection of reminders and current date, the upcoming notifications should include only reminders with due dates within the next 7 days.
**Validates: Requirements 6.1**

### Property 18: Notification dismissal preserves reminder
*For any* reminder, dismissing its notification should hide it from the notifications area while the reminder remains active in storage.
**Validates: Requirements 6.4**

### Property 19: Category filter correctness
*For any* collection of reminders and selected category, applying the category filter should return only reminders matching that category.
**Validates: Requirements 7.1**

### Property 20: Search text filtering
*For any* collection of reminders and search text, the filtered results should include only reminders whose names contain the search text (case-insensitive).
**Validates: Requirements 7.2**

### Property 21: Filter clearing restores full list
*For any* collection of reminders with active filters, clearing all filters should return the complete set of reminders.
**Validates: Requirements 7.3**

### Property 22: Custom recurrence calculation correctness
*For any* reminder with custom recurrence and a specified interval in days, calculating the next occurrence from a given due date should advance the date by exactly the specified number of days.
**Validates: Requirements 1.3**

### Property 23: Theme toggle switches mode
*For any* current theme state (light or dark), toggling the theme should switch to the opposite theme.
**Validates: Requirements 11.2**

### Property 24: Theme preference persistence round-trip
*For any* theme preference (light or dark), saving it to storage and then retrieving it should return the same theme value.
**Validates: Requirements 11.3, 11.4**

### Property 25: Theme change updates UI reactively
*For any* theme change, all visual elements should update to match the selected theme without requiring page refresh.
**Validates: Requirements 11.5**

### Property 26: Browser notification triggering
*For any* reminder that is upcoming or overdue, when browser notifications are enabled and the reminder has notifications enabled, a browser notification should be sent.
**Validates: Requirements 9.2**

### Property 27: Notification timing correctness
*For any* reminder and notification timing preference (1 day, 3 days, 1 week, or custom days before), notifications should be scheduled to trigger at exactly the specified number of days before the due date.
**Validates: Requirements 9.3**

### Property 28: Per-reminder notification exclusion
*For any* reminder with notificationsEnabled set to false, no browser notifications should be sent for that reminder, while the reminder remains active in storage and visible in lists.
**Validates: Requirements 9.4**

### Property 29: Calendar button presence
*For any* rendered reminder, the output should include an "Add to Google Calendar" button or link element.
**Validates: Requirements 10.1**

### Property 30: Google Calendar URL completeness
*For any* reminder, the generated Google Calendar URL should contain all reminder details (name as title, due date, amount and notes in description, recurrence pattern) in valid Google Calendar URL format.
**Validates: Requirements 10.2, 10.4**

### Property 31: Recurrence format conversion
*For any* reminder with a recurrence pattern (monthly, quarterly, semi-annually, annually, custom), the Google Calendar URL should include the recurrence in Google Calendar's RRULE format matching the reminder's pattern.
**Validates: Requirements 10.4**

### Property 32: Auto-calendar link generation
*For any* new reminder created when autoGenerateCalendarLinks preference is enabled, the reminder should automatically have a calendar link available without requiring user action.
**Validates: Requirements 10.5**

## Error Handling

The application implements comprehensive error handling at multiple levels:

### Validation Errors
- Input validation occurs before any data operations
- Validation errors are collected and presented to users with specific field-level messages
- Invalid operations are prevented from executing

### Storage Errors
- Local storage quota exceeded: Display warning and suggest deleting old reminders
- Storage unavailable: Display error message and operate in memory-only mode
- Data corruption: Attempt recovery, fallback to empty state if necessary

### Date Calculation Errors
- Invalid date inputs: Reject with validation error
- Date parsing failures: Display user-friendly error message
- Timezone handling: Use local timezone consistently throughout application

### UI Error States
- Failed operations: Display error messages with retry options
- Network unavailable (future enhancement): Queue operations for later sync
- Unexpected errors: Log to console, display generic error message, allow user to continue

## Testing Strategy

The application will use a dual testing approach combining unit tests and property-based tests to ensure comprehensive correctness validation.

### Property-Based Testing

We will use **fast-check** (for JavaScript/TypeScript) as our property-based testing library. Property-based tests will verify that the correctness properties defined above hold across a wide range of randomly generated inputs.

**Configuration:**
- Each property-based test will run a minimum of 100 iterations
- Each test will be tagged with a comment referencing its corresponding correctness property
- Tag format: `// Feature: reminder-manager, Property {number}: {property_text}`

**Property Test Coverage:**
- All 25 correctness properties will have corresponding property-based tests
- Tests will use smart generators that produce valid reminder data within realistic constraints
- Edge cases (empty lists, boundary dates, maximum values) will be handled by the generators

**Generator Strategy:**
- `arbitraryReminder()`: Generates valid reminder objects with random but realistic data
- `arbitraryReminderInput()`: Generates valid input data for reminder creation
- `arbitraryIncompleteInput()`: Generates input with missing required fields
- `arbitraryDate()`: Generates dates within reasonable ranges (past 1 year to future 5 years)
- `arbitraryRecurrence()`: Generates recurrence patterns (including custom with random intervals)
- `arbitraryCategory()`: Generates reminder categories
- `arbitraryTheme()`: Generates theme values (light or dark)

### Unit Testing

Unit tests will complement property-based tests by verifying specific examples and integration points:

**Core Logic Tests:**
- Specific recurrence calculations (e.g., monthly from Jan 31 → Feb 28/29)
- Edge cases like leap years, month-end dates
- Specific validation scenarios

**Component Integration Tests:**
- Form submission workflows
- List rendering with specific data sets
- Filter and search with known inputs

**UI Interaction Tests:**
- Button click handlers
- Form input changes
- Modal dialogs

**Test Organization:**
- Tests co-located with source files using `.test.ts` suffix
- Test files mirror the structure of source files
- Shared test utilities in `tests/utils/` directory

### Testing Tools
- **Test Runner**: Vitest (fast, modern, ESM-native)
- **Property Testing**: fast-check
- **DOM Testing**: @testing-library/dom for UI component tests
- **Assertions**: Vitest's built-in assertions

### Test Execution
- Tests run on every code change during development
- All tests must pass before considering a task complete
- Property-based tests will catch edge cases that unit tests might miss
- Unit tests provide fast feedback on specific functionality

## Implementation Notes

### Technology Stack
- **HTML5**: Semantic markup for accessibility
- **CSS3**: Modern styling with CSS Grid and Flexbox for responsive layouts
- **TypeScript**: Type-safe JavaScript for better maintainability
- **Local Storage API**: Browser-native persistence
- **Date-fns**: Robust date manipulation library

### Browser Compatibility
- Target modern browsers (Chrome, Firefox, Safari, Edge - last 2 versions)
- Graceful degradation for older browsers
- Feature detection for local storage availability

### Performance Considerations
- Lazy rendering for large reminder lists (virtual scrolling if needed)
- Debounced search input to avoid excessive filtering
- Efficient date calculations cached where appropriate
- Minimal DOM manipulation through efficient state updates

### Accessibility
- Semantic HTML elements (button, form, input, etc.)
- ARIA labels for screen readers
- Keyboard navigation support
- Focus management for modals and forms
- Sufficient color contrast for visual indicators in both light and dark modes

### Theme Implementation
- CSS custom properties (variables) for colors that change between themes
- System theme detection using `prefers-color-scheme` media query
- Theme applied via `data-theme` attribute on document root
- Theme toggle button with dynamic icon (🌙 for light mode, ☀️ for dark mode)
- Theme toggle button accessible via keyboard
- Smooth transitions between theme changes
- Theme preference stored in local storage with key `reminder-manager-theme`

### Notification Implementation
- Use Browser Notifications API for system-level notifications
- Request permission using `Notification.requestPermission()`
- Check notification support with feature detection
- Schedule notifications based on user timing preferences
- Per-reminder notification toggle in reminder form and list
- Graceful fallback to in-app notifications when browser notifications unavailable
- Notification preferences stored in local storage with key `reminder-manager-notification-prefs`
- Background check for upcoming reminders (using setInterval or service worker in future)

### Google Calendar Integration Implementation
- Generate Google Calendar URLs using the standard format: `https://calendar.google.com/calendar/render?action=TEMPLATE&text={title}&dates={start}/{end}&details={description}&recur={rrule}`
- Convert reminder recurrence patterns to Google Calendar RRULE format:
  - Monthly: `RRULE:FREQ=MONTHLY`
  - Quarterly: `RRULE:FREQ=MONTHLY;INTERVAL=3`
  - Semi-annually: `RRULE:FREQ=MONTHLY;INTERVAL=6`
  - Annually: `RRULE:FREQ=YEARLY`
  - Custom (every X days): `RRULE:FREQ=DAILY;INTERVAL=X`
- Format dates in ISO 8601 format (YYYYMMDDTHHMMSSZ)
- URL-encode all parameters to handle special characters
- Open calendar links in new tab using `window.open()` with `target="_blank"`
- Display calendar button/link on each reminder in the list
- Optional auto-generation setting in notification preferences

### Future Enhancements
- Cloud sync across devices
- Email/SMS notifications
- Recurring reminder templates
- Budget tracking and analytics
- Import/export functionality
- Multi-currency support
