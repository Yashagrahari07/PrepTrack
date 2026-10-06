import { useEffect, useState } from 'react';
import { AlertTriangle, Clock, X } from 'lucide-react';
import { useAppStore } from '@/stores/app/app.store';

export function RateLimitBanner() {
    const rateLimit = useAppStore((s) => s.rateLimit);
    const clearRateLimit = useAppStore((s) => s.clearRateLimit);

    const [countdown, setCountdown] = useState<number>(0);

    useEffect(() => {
        if (!rateLimit.isLimited) {
            setCountdown(0);
            return;
        }

        setCountdown(rateLimit.secondsRemaining || 60);

        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    clearRateLimit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [rateLimit.isLimited, rateLimit.secondsRemaining, clearRateLimit]);

    if (!rateLimit.isLimited || countdown <= 0) return null;

    return (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] max-w-lg w-[90%] bg-amber-950/90 border border-amber-500/40 text-amber-200 backdrop-blur-xl p-4 rounded-2xl shadow-2xl animate-fade-down flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 shrink-0 animate-pulse">
                    <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="flex flex-col min-w-0">
                    <p className="font-semibold text-xs sm:text-sm text-amber-100 truncate">
                        Rate Limit Active — Slow Down
                    </p>
                    <p className="text-[11px] text-amber-300/80 flex items-center gap-1.5 mt-0.5">
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        <span>Please wait <strong>{countdown}s</strong> before making more requests.</span>
                    </p>
                </div>
            </div>

            <button
                onClick={clearRateLimit}
                className="text-amber-400 hover:text-amber-100 p-1 rounded-lg transition-colors shrink-0"
                title="Dismiss"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
}
