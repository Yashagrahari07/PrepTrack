import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { ReactNode } from 'react';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 2, // 2 minutes
            gcTime: 1000 * 60 * 10,   // 10 minutes
            retry: 1,
            refetchOnWindowFocus: false,
        },
        mutations: {
            onError: (error: unknown) => {
                // Global mutation error fallback — individual hooks override this
                const msg =
                    (error as { response?: { data?: { error?: string } } })?.response?.data?.error;
                if (msg) {
                    toast.error(msg);
                }
            },
        },
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
