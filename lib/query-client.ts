import { QueryClient } from "@tanstack/react-query";

// ── Singleton QueryClient ──────────────────────────────────────────────────────
// Created once and re-used across the app. Adjust defaults to fit your needs.
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Data stays fresh for 1 minute before being considered stale
            staleTime: 60_000,
            // Keep unused data in cache for 5 minutes
            gcTime: 5 * 60_000,
            // Retry once on failure (some network hiccups are transient)
            retry: 1,
            // Don't refetch when the window regains focus (emergency app context)
            refetchOnWindowFocus: false,
        },
        mutations: {
            // Don't retry mutations automatically — let the UI surface errors
            retry: false,
        },
    },
});
