# Implementation Plan

- [x] 1. Set up project structure and development environment
  - Create HTML file with semantic structure and meta tags
  - Set up TypeScript configuration with strict mode
  - Configure Vitest for testing with fast-check integration
  - Create directory structure: src/, src/models/, src/services/, src/components/, src/utils/, tests/
  - Install dependencies: TypeScript, Vitest, fast-check, @testing-library/dom, date-fns
  - Create package.json with build scripts
  - _Requirements: All_

- [x] 2. Implement core data models and types
  - [x] 2.1 Define TypeScript interfaces and types
    - Create Reminder, ReminderInput, ReminderCategory, RecurrencePattern, ReminderStatus, Currency types
    - Create CompletionRecord, FilterCriteria, ValidationResult interfaces
    - Add customRecurrenceDays field for custom interval support
    - Add type guards and utility types
    - _Requirements: 1.1, 1.2, 1.3_
  
  - [ ]* 2.2 Write property test for reminder data model
    - **Property 1: Reminder creation and persistence round-trip**
    - **Validates: Requirements 1.1, 1.4, 1.5**

- [x] 3. Implement validation service
  - [x] 3.1 Create ValidationService with input validation logic
    - Implement validateReminderInput function
    - Implement field-level validators (validateDate, validateAmount, validateRequired)
    - Add validation for custom recurrence interval (must be positive integer)
    - Return structured validation errors with field names and messages
    - _Requirements: 1.3, 1.4_
  
  - [ ]* 3.2 Write property test for validation
    - **Property 3: Validation rejects incomplete input**
    - **Validates: Requirements 1.3**

- [x] 4. Implement recurrence calculation logic
  - [x] 4.1 Create RecurrenceCalculator service
    - Implement calculateNextOccurrence for all recurrence patterns (monthly, quarterly, semi-annually, annually, custom)
    - Handle edge cases (month-end dates, leap years)
    - For custom recurrence, add customRecurrenceDays to current due date
    - Use date-fns for reliable date arithmetic
    - _Requirements: 1.2, 1.3, 5.2_
  
  - [ ]* 4.2 Write property test for recurrence calculation
    - **Property 2: Recurrence pattern calculation correctness**
    - **Validates: Requirements 1.2**
  
  - [ ]* 4.3 Write property test for custom recurrence calculation
    - **Property 22: Custom recurrence calculation correctness**
    - **Validates: Requirements 1.3**
  
  - [ ]* 4.4 Write unit tests for recurrence edge cases
    - Test monthly recurrence from Jan 31 → Feb 28/29
    - Test leap year handling
    - Test year-end to year-start transitions
    - Test custom recurrence with various intervals (7, 14, 30 days)
    - _Requirements: 1.2, 1.3_

- [x] 5. Implement storage service
  - [x] 5.1 Create StorageService with local storage interface
    - Implement saveReminder, getReminder, getAllReminders functions
    - Implement updateReminder and deleteReminder functions
    - Add error handling for storage quota and availability
    - Use JSON serialization with date handling
    - Handle currency field with default to USD for backward compatibility
    - _Requirements: 1.6, 4.2_
  
  - [ ]* 5.2 Write unit tests for storage operations
    - Test storage quota exceeded scenario
    - Test storage unavailable fallback
    - Test data serialization/deserialization
    - _Requirements: 1.4_

- [x] 6. Implement reminder service (business logic)
  - [x] 6.1 Create ReminderService with CRUD operations
    - Implement createReminder with validation and ID generation
    - Implement updateReminder with validation
    - Implement deleteReminder
    - Implement getAllReminders with sorting by due date
    - _Requirements: 1.1, 1.4, 2.1, 3.2, 4.2_

  - [x] 6.2 Implement reminder completion logic
    - Implement markComplete function
    - Add completion record to history
    - Calculate next occurrence for recurring reminders
    - Update reminder status
    - _Requirements: 5.1, 5.2_
  
  - [x] 6.3 Implement filtering and search logic
    - Implement filterReminders with category and search text support
    - Implement getUpcomingReminders (within 7 days)
    - Implement getOverdueReminders
    - _Requirements: 6.1, 7.1, 7.2_
  
  - [ ]* 6.4 Write property test for sorting
    - **Property 4: Reminder list sorting by due date**
    - **Validates: Requirements 2.1**
  
  - [ ]* 6.5 Write property test for update persistence
    - **Property 9: Update persistence**
    - **Validates: Requirements 3.2**
  
  - [ ]* 6.6 Write property test for deletion
    - **Property 12: Deletion removes from storage**
    - **Validates: Requirements 4.2, 4.4**
  
  - [ ]* 6.7 Write property test for completion tracking
    - **Property 14: Completion records tracking**
    - **Validates: Requirements 5.1**
  
  - [ ]* 6.8 Write property test for recurring advancement
    - **Property 15: Recurring reminder advancement**
    - **Validates: Requirements 5.2**
  
  - [ ]* 6.9 Write property test for history preservation
    - **Property 11: Update preserves completion history**
    - **Validates: Requirements 3.4**
  
  - [ ]* 6.10 Write property test for upcoming notifications
    - **Property 17: Upcoming notifications filtering**
    - **Validates: Requirements 6.1**
  
  - [ ]* 6.11 Write property test for category filtering
    - **Property 19: Category filter correctness**
    - **Validates: Requirements 7.1**
  
  - [ ]* 6.12 Write property test for search filtering
    - **Property 20: Search text filtering**
    - **Validates: Requirements 7.2**
  
  - [ ]* 6.13 Write property test for filter clearing
    - **Property 21: Filter clearing restores full list**
    - **Validates: Requirements 7.3**

- [x] 7. Implement theme management
  - [x] 7.1 Create ThemeManager utility class
    - Implement loadTheme to detect system preference using prefers-color-scheme
    - Implement toggleTheme to switch between light and dark modes
    - Implement applyTheme to update data-theme attribute on document root
    - Update theme icon dynamically (🌙 for light mode, ☀️ for dark mode)
    - Use localStorage directly for theme persistence with key 'reminder-manager-theme'
    - Set up event listeners for theme toggle button
    - _Requirements: 11.1, 11.2, 11.3, 11.4_
  
  - [ ]* 7.2 Write property test for theme toggle
    - **Property 23: Theme toggle switches mode**
    - **Validates: Requirements 11.2**
  
  - [ ]* 7.3 Write property test for theme persistence
    - **Property 24: Theme preference persistence round-trip**
    - **Validates: Requirements 11.3, 11.4**
  
  - [ ]* 7.4 Write property test for theme UI reactivity
    - **Property 25: Theme change updates UI reactively**
    - **Validates: Requirements 11.5**

- [x] 8. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Implement state management
  - [x] 9.1 Create AppState class for centralized state
    - Implement observable state pattern with subscribers
    - Store current reminders, filters, UI state, theme state
    - Implement state update methods that notify subscribers
    - _Requirements: 2.5, 11.5_
  
  - [ ]* 9.2 Write property test for UI reactivity
    - **Property 7: UI state reactivity**
    - **Validates: Requirements 2.5**

- [x] 10. Create base HTML structure and CSS
  - [x] 10.1 Build semantic HTML structure
    - Create main layout with header, main content area, and sections
    - Add theme toggle button in header
    - Add form section for creating/editing reminders
    - Add reminders list section
    - Add notifications panel section
    - Add filter bar section
    - _Requirements: 8.1, 8.2, 11.2_
  
  - [x] 10.2 Implement responsive CSS styling with theme support
    - Create CSS variables for colors, spacing, typography
    - Define separate color schemes for light and dark themes using CSS custom properties
    - Implement mobile-first responsive layout with media queries
    - Style form elements with proper focus states
    - Create visual indicators for reminder statuses (overdue, upcoming, completed)
    - Ensure accessibility with sufficient color contrast in both themes
    - Add smooth transitions for theme changes
    - _Requirements: 2.3, 5.3, 6.2, 8.1, 8.2, 8.4, 11.5_

- [x] 11. Implement ReminderForm component
  - [x] 11.1 Create form UI and input handling
    - Build form with inputs for name, amount, currency, due date, category, recurrence, notes
    - Add conditional custom interval input that appears when "custom" recurrence is selected
    - Implement toggleCustomRecurrence to show/hide custom days input
    - Implement form validation on submit (including custom interval validation)
    - Display validation errors inline with field-specific error messages
    - Handle both create and edit modes with dynamic form title
    - Clear form after successful submission
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 3.1_
  
  - [ ]* 11.2 Write property test for edit form pre-population
    - **Property 8: Edit form pre-population**
    - **Validates: Requirements 3.1**
  
  - [ ]* 11.3 Write property test for edit cancellation
    - **Property 10: Edit cancellation preserves original**
    - **Validates: Requirements 3.3**
  
  - [ ]* 11.4 Write unit tests for form interactions
    - Test form submission with valid data
    - Test form validation error display
    - Test edit mode vs create mode
    - Test cancel button behavior
    - Test custom recurrence input visibility and validation
    - _Requirements: 1.1, 1.3, 1.4, 3.1, 3.3_

- [x] 12. Implement ReminderList component
  - [x] 12.1 Create list rendering logic
    - Render reminders from state
    - Display all required fields (name, amount, due date, category, days until due)
    - For custom recurrence, display "Every X days" in the recurrence info
    - Calculate and display days until due or days overdue
    - Apply status-based CSS classes for visual distinction
    - Handle empty state with appropriate message
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  
  - [x] 12.2 Add action buttons for each reminder
    - Add edit button that populates form
    - Add delete button with confirmation dialog
    - Add mark complete button
    - Wire up event handlers to ReminderService
    - _Requirements: 3.1, 4.1, 5.1_
  
  - [ ]* 12.3 Write property test for rendered content
    - **Property 5: Rendered reminders contain required information**
    - **Validates: Requirements 2.2, 6.3**
  
  - [ ]* 12.4 Write property test for visual distinction
    - **Property 6: Status-based visual distinction**
    - **Validates: Requirements 2.3, 5.3, 6.2**
  
  - [ ]* 12.5 Write unit tests for list component
    - Test empty state display
    - Test reminder rendering with specific data
    - Test action button clicks
    - _Requirements: 2.2, 2.4, 3.1, 4.1, 5.1_

- [x] 13. Implement NotificationPanel component
  - [x] 13.1 Create notifications display
    - Filter and display upcoming reminders (within 7 days)
    - Filter and display overdue reminders
    - Show reminder name, amount, and days until/overdue
    - Apply visual emphasis for overdue items
    - Implement dismiss functionality
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  
  - [ ]* 13.2 Write property test for notification dismissal
    - **Property 18: Notification dismissal preserves reminder**
    - **Validates: Requirements 6.4**
  
  - [ ]* 13.3 Write unit tests for notification panel
    - Test upcoming reminders display
    - Test overdue reminders display
    - Test dismiss functionality
    - _Requirements: 6.1, 6.2, 6.4_

- [x] 14. Implement FilterBar component
  - [x] 14.1 Create filter and search UI
    - Add search input with debouncing
    - Add category filter dropdown
    - Implement filter state management
    - Add clear filters button
    - Display "no results" message when filters return empty
    - _Requirements: 7.1, 7.2, 7.3, 7.4_
  
  - [ ]* 14.2 Write unit tests for filter bar
    - Test search input updates filter state
    - Test category selection updates filter state
    - Test clear filters resets state
    - Test no results message display
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 15. Implement completion history view
  - [x] 15.1 Create history display component
    - Show completion history for selected reminder
    - Display all completion records with dates
    - Format dates in readable format
    - _Requirements: 5.4_
  
  - [ ]* 15.2 Write property test for history display
    - **Property 16: Completion history display**
    - **Validates: Requirements 5.4**

- [x] 16. Wire up application initialization and event handling
  - [x] 16.1 Create main application controller
    - Initialize ThemeManager and apply saved or system theme
    - Initialize AppState with data from storage
    - Initialize all components
    - Set up event listeners and state subscriptions
    - Wire up theme toggle button to ThemeManager
    - Handle page load and initial render
    - _Requirements: All_
  
  - [x] 16.2 Implement delete confirmation dialog
    - Show confirmation modal on delete action
    - Handle confirm and cancel actions
    - _Requirements: 4.1, 4.3_
  
  - [ ]* 16.3 Write property test for deletion cancellation
    - **Property 13: Deletion cancellation preserves reminder**
    - **Validates: Requirements 4.3**

- [x] 17. Add error handling and edge cases
  - [x] 17.1 Implement error handling throughout application
    - Add try-catch blocks for storage operations
    - Display user-friendly error messages
    - Handle storage quota exceeded
    - Handle storage unavailable scenario
    - Log errors to console for debugging
    - _Requirements: All_

- [x] 18. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 19. Polish and accessibility improvements
  - [x] 19.1 Enhance accessibility
    - Add ARIA labels to interactive elements (including theme toggle)
    - Ensure keyboard navigation works throughout
    - Test with screen reader
    - Verify color contrast meets WCAG standards in both light and dark modes
    - Add focus indicators
    - _Requirements: 8.1, 8.2, 11.2_
  
  - [x] 19.2 Add final polish
    - Smooth transitions and animations (including theme transitions)
    - Loading states for operations
    - Improve mobile touch targets
    - Test on multiple browsers and devices
    - Test theme switching on different devices
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 11.5_
