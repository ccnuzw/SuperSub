# Common Composables

This directory contains reusable composables for common business logic patterns across the SuperSub application.

## Available Composables

### 1. useClipboard

Centralized clipboard functionality with error handling and fallback support.

**Features:**
- Modern Clipboard API with execCommand fallback
- Error handling and user feedback
- TypeScript support
- Multiple data type support (text, JSON, URLs, table rows)

```typescript
import { useClipboard } from '@/composables/common';

const { copy, copyText, copyJson, copyUrl, copyTableRow, isLoading } = useClipboard();

// Copy text
await copyText('Hello World');

// Copy with custom options
await copy('Data', {
  successMessage: 'Custom success message',
  showMessage: true
});

// Copy JSON data
await copyJson({ name: 'John', age: 30 });

// Copy table row
await copyTableRow(rowData, ['name', 'email']);
```

### 2. useNotifications

Unified notification handling with consistent messaging across the application.

**Features:**
- Toast messages (success, error, warning, info)
- Dialog confirmations
- Batch operation results
- Template-based messages
- API error handling

```typescript
import { useNotifications } from '@/composables/common';

const { success, error, warning, info, confirm, apiError, showBatchResult } = useNotifications();

// Simple messages
success('Operation completed');
error('Something went wrong');

// Confirmation dialog
const confirmed = await confirm('Are you sure?', 'This action cannot be undone');

// API error handling
try {
  await apiCall();
} catch (err) {
  apiError(err, 'Failed to load data');
}

// Batch operations
showBatchResult({
  total: 10,
  success: 8,
  failed: 2,
  errors: ['Item 5 failed']
});
```

### 3. useDateFormatting

Consistent date and time formatting with localization support.

**Features:**
- Multiple predefined formats
- Custom format support
- Timezone handling
- Relative time support
- Duration formatting
- Smart date display

```typescript
import { useDateFormatting } from '@/composables/common';

const { formatDate, formatRelative, formatDuration, formatSmartDate, isToday } = useDateFormatting();

// Format date
formatDate(new Date(), { type: 'datetime' });

// Relative time
formatRelative(new Date(Date.now() - 3600000)); // "1小时前"

// Duration
formatDuration(3600); // "1小时"

// Smart formatting (recent times show relative, older times show absolute)
formatSmartDate(new Date());

// Date checks
if (isToday(someDate)) {
  // Show specific format for today
}
```

### 4. useTableActions

Common table CRUD operations with confirmation dialogs and error handling.

**Features:**
- Single item actions (edit, delete, copy, view, etc.)
- Batch operations (delete multiple, export, etc.)
- Selection management
- Pagination and sorting
- Loading states
- Export functionality

```typescript
import { useTableActions } from '@/composables/common';

const {
  actions,
  handleAction,
  selection,
  toggleSelection,
  clearSelection,
  pagination,
  setPagination,
  exportToCSV
} = useTableActions();

// Register custom action
registerAction({
  type: 'delete',
  action: async (item) => {
    await deleteItem(item.id);
  },
  successMessage: 'Item deleted successfully'
});

// Handle action
await handleAction('delete', item);

// Batch operations
await handleBatchAction({
  type: 'delete',
  action: async (items) => {
    // Delete multiple items
  }
});

// Export to CSV
exportToCSV(columns, 'filename.csv');
```

### 5. useApiErrorHandler

Standardized API error handling with automatic retry logic.

**Features:**
- Error classification and type detection
- Automatic retry with exponential backoff
- User-friendly error messages
- Validation error handling
- Rate limiting detection
- Authentication error handling
- Error logging and monitoring

```typescript
import { useApiErrorHandler } from '@/composables/common';

const { handleError, executeWithRetry, wrapApiCall, isLoading } = useApiErrorHandler();

// Handle error manually
try {
  await apiCall();
} catch (error) {
  await handleError(error, { context: 'User creation' });
}

// Auto-retry with error handling
const result = await executeWithRetry(() => apiCall(), {
  maxAttempts: 5,
  successMessage: 'Data loaded successfully'
});

// Wrap API call with automatic handling
const wrappedCall = wrapApiCall(api.fetchUsers, {
  errorMessage: 'Failed to load users',
  showLoading: true
});
const users = await wrappedCall();
```

## Installation

These composables are designed to work with Vue 3 and the existing SuperSub stack:

- Vue 3 (Composition API)
- TypeScript
- Naive UI
- Day.js for date formatting

## Best Practices

1. **Import from index**: Use the index file for clean imports:
   ```typescript
   import { useClipboard, useNotifications } from '@/composables/common';
   ```

2. **Destructure what you need**: Only destructure the methods and state you actually use.

3. **Handle errors consistently**: Use `useApiErrorHandler` for all API calls to ensure consistent error handling.

4. **Use templates**: Leverage the built-in message templates for consistent user messaging.

5. **TypeScript**: All composables include full TypeScript support with proper type definitions.

6. **Error handling**: Always handle async operations properly with try-catch blocks.

## Dependencies

- `vue` - Vue 3 framework
- `dayjs` - Date manipulation and formatting
- `naive-ui` - UI components for notifications and dialogs

## Contributing

When adding new composables:

1. Follow the same structure and patterns
2. Include comprehensive JSDoc documentation
3. Add TypeScript type definitions
4. Include usage examples
5. Handle edge cases and errors appropriately
6. Make composables easily testable

## Testing

These composables are designed to be easily testable. When writing tests:

1. Mock external dependencies (like `navigator.clipboard`)
2. Test both success and error scenarios
3. Verify reactive state updates
4. Test edge cases and invalid inputs