# Testing and Error Visibility

This folder was created to centralize tools for improving application reliability and user feedback.

## 🛡️ Error Visibility Tools

### 1. `ErrorBoundary.tsx`
**Purpose**: Prevents the "White Screen of Death". If a JavaScript error occurs during rendering, this component catches it and shows a "Try Again" screen instead of crashing the tab.

**How to integrate (without breaking anything)**:
Open `src/App.tsx` and wrap your router:

```tsx
import GlobalErrorBoundary from "./testing-error-visibility/ErrorBoundary";

const App = () => (
  <GlobalErrorBoundary>
    <QueryClientProvider client={queryClient}>
       {/* ... rest of your App context */}
    </QueryClientProvider>
  </GlobalErrorBoundary>
);
```

### 2. `ErrorTranslator.ts`
**Purpose**: Converts technical errors (like "Failed to fetch") into friendly user messages.

**Usage**:
```tsx
import { translateError } from "@/testing-error-visibility/ErrorTranslator";

try {
  await someDatabaseCall();
} catch (error) {
  const { title, description } = translateError(error);
  toast({ title, description, variant: "destructive" });
}
```

---

## 🧪 Automated Testing (Vitest)

Vitest is already installed and configured in this project. You can run tests to verify financial calculations or other logic.

### 1. Run All Tests
To run all tests once:
```powershell
npx vitest run
```

### 2. Watch Mode (Recommended for Development)
To keep tests running and automatically re-run them when you save a file:
```powershell
npx vitest
```

### 3. Current Test Files
- `src/utils/finance.test.ts`: Verifies GST and currency formatting logic.
