import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

export type Theme = 'dark' | 'light';
export type ToastTone = 'success' | 'info' | 'error';

export interface Toast {
  id: number;
  message: string;
  tone: ToastTone;
}

interface AppContextValue {
  theme: Theme;
  toggleTheme: () => void;
  /** Module ids used during this browser session (memory only, newest first). */
  recent: string[];
  markRecent: (id: string) => void;
  toasts: Toast[];
  toast: (message: string, tone?: ToastTone) => void;
  dismissToast: (id: number) => void;
}

const Ctx = createContext<AppContextValue | null>(null);

function initialTheme(): Theme {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const [recent, setRecent] = useState<string[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      // Only the UI theme preference is stored – never user-entered content.
      localStorage.setItem('drqa-theme', theme);
    } catch {
      /* storage unavailable – theme still works for this session */
    }
  }, [theme]);

  const toggleTheme = useCallback(() => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), []);

  const markRecent = useCallback((id: string) => {
    setRecent((r) => (r[0] === id ? r : [id, ...r.filter((x) => x !== id)].slice(0, 6)));
  }, []);

  const dismissToast = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const toast = useCallback(
    (message: string, tone: ToastTone = 'success') => {
      const id = nextId.current++;
      setToasts((t) => [...t.slice(-2), { id, message, tone }]);
      setTimeout(() => dismissToast(id), 2600);
    },
    [dismissToast],
  );

  const value = useMemo(
    () => ({ theme, toggleTheme, recent, markRecent, toasts, toast, dismissToast }),
    [theme, toggleTheme, recent, markRecent, toasts, toast, dismissToast],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppContextValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp must be used inside <AppProvider>');
  return v;
}
