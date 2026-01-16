import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';

export const store = configureStore({
  reducer: {
    // Add reducers here when needed
  },
});

// TypeScript type for the entire Redux state tree
// Automatically inferred from the store configuration
export type RootState = ReturnType<typeof store.getState>;

// Typed wrapper around useSelector hook
// Ensures the `state` parameter in selectors is always typed as RootState
// Provides autocomplete and type safety when accessing state properties
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// TypeScript type for the Redux dispatch function
// Ensures dispatched actions are type-safe
export type AppDispatch = typeof store.dispatch;

// Typed wrapper around useDispatch hook
// Automatically types dispatch with AppDispatch, so you don't need to specify types manually
// Usage: const dispatch = useAppDispatch(); dispatch(action) is fully typed
export const useAppDispatch = () => useDispatch<AppDispatch>();
