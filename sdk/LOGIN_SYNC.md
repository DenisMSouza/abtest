# Login Sync Functionality

## Overview

The `useExperiment` hook now automatically handles the scenario where a user visits a page without being logged in, gets assigned a variation, and then logs in later. This ensures a seamless A/B testing experience across user sessions.

## How It Works

### 1. User Not Logged In

When a user visits a page without a `userId`:

- The hook creates a variation based on the experiment's weights
- Stores the variation in `localStorage`
- **Does not** persist to the backend (no userId available)

### 2. User Logs In

When the `userId` becomes available (user logs in):

- The hook detects the `userId` change
- Re-runs the `syncExperiment` function
- The `syncExperiment` function now has access to `userId` and will:
  - Check if the user already has a variation in the backend
  - If no backend variation exists: persists the localStorage variation to backend
  - If backend variation exists: uses the backend variation (updates localStorage if different)

### 3. User Already Logged In

When a user is already logged in:

- Normal flow: creates variation and persists to backend immediately

## Implementation Details

The login sync is implemented using two `useEffect` hooks:

1. **Initial Load Effect**: Fetches experiment and runs `syncExperiment`
2. **UserId Change Effect**: Re-runs `syncExperiment` when `userId` changes

```typescript
// Handle userId changes - re-run syncExperiment when user logs in/out
useEffect(() => {
  const handleUserIdChange = async () => {
    if (state.experiment) {
      debugLog(
        stableConfig,
        `UserId changed to ${stableConfig.userId}, re-syncing experiment`
      );
      await syncExperiment(state.experiment);
    }
  };

  handleUserIdChange();
}, [stableConfig.userId, state.experiment, syncExperiment]);
```

## Benefits

1. **Seamless Experience**: Users don't lose their variation assignment when logging in
2. **Data Consistency**: Variations are properly synced between localStorage and backend
3. **No Data Loss**: Existing variations are preserved and synced
4. **Automatic**: No additional code required from developers

## Example Scenarios

### Scenario 1: New User

1. User visits page → gets "blue" variation → stored in localStorage
2. User logs in → "blue" variation is persisted to backend for user-123
3. User visits page again → gets "blue" variation from backend

### Scenario 2: Returning User

1. User visits page → gets "blue" variation → stored in localStorage
2. User logs in → backend already has "red" variation for user-123
3. User's variation changes to "red" (backend takes precedence)
4. localStorage is updated to "red"

### Scenario 3: Already Logged In

1. User visits page (already logged in) → gets "blue" variation → persisted to backend immediately

## Testing

The login sync functionality is thoroughly tested with the following scenarios:

- ✅ Sync localStorage variation to backend when user logs in
- ✅ Use backend variation when user logs in and already has one
- ✅ Normal flow when user was already logged in

## Configuration

No additional configuration is required. The login sync works automatically when:

- The `userId` in the config changes from `undefined` to a value
- The experiment is already loaded
- The user has a variation assigned

## Debugging

Enable debug mode to see login sync logs:

```typescript
const config = {
  apiUrl: "http://localhost:3001/api",
  userId: userId, // Changes from undefined to value when user logs in
  debug: true, // Enable to see sync logs
};
```

Debug logs will show:

- `UserId changed to user-123, re-syncing experiment`
- `Using variation blue from localStorage for experiment test-experiment`
- `Persisted variation blue for experiment test-experiment`
