"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";

// ── QueryProvider ──────────────────────────────────────────────────────────────
// Wraps children with the TanStack QueryClientProvider.
// Must be a Client Component because QueryClientProvider uses React context.
export default function QueryProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
}
