import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 2, // 2 minutes
            gcTime: 1000 * 60 * 10,   // 10 minutes
            retry: 1,
            refetchOnWindowFocus: false,
        },
        // NOTE: No global mutations.onError toast here — every mutation hook
        // already shows its own local error toast. A global handler would
        // double-fire (TanStack v5 runs both), stacking duplicate toasts.
    },
});

interface QueryProviderProps {
    children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}
