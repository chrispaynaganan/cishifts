"use client";

import { AnimatePresence, motion } from "motion/react";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

type Tone = "default" | "success" | "info" | "danger";

type Toast = {
  id: number;
  message: ReactNode;
  tone: Tone;
  action?: { label: string; onClick: () => void };
};

type ToastApi = {
  toast: (
    message: ReactNode,
    opts?: { tone?: Tone; action?: Toast["action"]; duration?: number },
  ) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

const DOT: Record<Tone, string> = {
  default: "bg-white/60",
  success: "bg-success-ring",
  info: "bg-facebook",
  danger: "bg-brand-orange",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const toast = useCallback<ToastApi["toast"]>(
    (message, opts = {}) => {
      const id = nextId.current++;
      setToasts((t) =>
        [...t, { id, message, tone: opts.tone ?? "default", action: opts.action }].slice(-3),
      );
      window.setTimeout(() => dismiss(id), opts.duration ?? 3600);
    },
    [dismiss],
  );

  const api = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-6 z-100 flex flex-col items-center gap-2">
        <AnimatePresence initial={false}>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 24, scale: 0.9, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: 12, scale: 0.95, filter: "blur(4px)" }}
              transition={{ type: "spring", stiffness: 420, damping: 30 }}
              className="pointer-events-auto flex items-center gap-3 rounded-full bg-ink py-3 pr-3 pl-5 text-sm tracking-ui text-white shadow-panel"
            >
              <span className={`size-2 shrink-0 rounded-full ${DOT[t.tone]}`} />
              <span>{t.message}</span>
              {t.action ? (
                <button
                  type="button"
                  onClick={() => {
                    t.action?.onClick();
                    dismiss(t.id);
                  }}
                  className="rounded-full bg-white/12 px-3 py-1 font-medium text-white transition-colors hover:bg-white/20"
                >
                  {t.action.label}
                </button>
              ) : (
                <button
                  type="button"
                  aria-label="Dismiss"
                  onClick={() => dismiss(t.id)}
                  className="grid size-6 place-items-center rounded-full text-white/50 transition-colors hover:bg-white/10 hover:text-white"
                >
                  ×
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx.toast;
}
