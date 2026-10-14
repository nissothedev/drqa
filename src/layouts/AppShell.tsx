import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { ChevronLeft, LayoutDashboard, Menu, Moon, Search, ShieldCheck, Sun, X, CheckCircle2, Info, AlertCircle } from 'lucide-react';
import { Logo } from '../components/brand/Logo';
import { API_MODULES, QA_MODULES, moduleByPath, type ModuleDef } from '../data/modules';
import { useApp } from '../context/AppContext';
import { cn } from '../utils/cn';
import { CommandPalette } from './CommandPalette';

function NavItem({ m, onNavigate }: { m: ModuleDef; onNavigate?: () => void }) {
  const Icon = m.icon;
  return (
    <NavLink
      to={m.path}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition',
          isActive ? 'bg-accent/10 font-medium text-fg' : 'text-muted hover:bg-surface-2 hover:text-fg',
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && <span className="absolute inset-y-1.5 start-0 w-[3px] rounded-full bg-gradient-to-b from-accent to-violet" aria-hidden />}
          <Icon className={cn('size-[18px] shrink-0 transition', isActive ? 'text-accent' : 'text-subtle group-hover:text-muted')} aria-hidden />
          <span className="truncate">{m.title}</span>
          {m.flagship && <span className="badge badge-accent ms-auto">Flagship</span>}
        </>
      )}
    </NavLink>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className="px-4 pb-4 pt-5">
        <Link to="/" onClick={onNavigate} aria-label="DRQA – לוח הבקרה">
          <Logo />
        </Link>
      </div>
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-4" aria-label="ניווט ראשי">
        <div>
          <NavLink
            to="/"
            end
            onClick={onNavigate}
            className={({ isActive }) =>
              cn('flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition', isActive ? 'bg-accent/10 font-medium text-fg' : 'text-muted hover:bg-surface-2 hover:text-fg')
            }
          >
            {({ isActive }) => (
              <>
                <LayoutDashboard className={cn('size-[18px]', isActive ? 'text-accent' : 'text-subtle')} aria-hidden />
                לוח בקרה
              </>
            )}
          </NavLink>
        </div>
        <div>
          <div className="mb-2 flex items-center gap-2 px-3">
            <span className="text-2xs font-bold uppercase tracking-[0.14em] text-accent" dir="ltr">
              API Diagnostics
            </span>
            <span className="h-px flex-1 bg-gradient-to-l from-transparent to-accent/30" aria-hidden />
          </div>
          <div className="space-y-0.5">
            {API_MODULES.map((m) => (
              <NavItem key={m.id} m={m} onNavigate={onNavigate} />
            ))}
          </div>
        </div>
        <div>
          <div className="mb-2 flex items-center gap-2 px-3">
            <span className="text-2xs font-bold uppercase tracking-[0.14em] text-subtle" dir="ltr">
              QA Toolkit
            </span>
            <span className="h-px flex-1 bg-line" aria-hidden />
          </div>
          <div className="space-y-0.5">
            {QA_MODULES.map((m) => (
              <NavItem key={m.id} m={m} onNavigate={onNavigate} />
            ))}
          </div>
        </div>
      </nav>
      <div className="m-3 rounded-xl border border-line bg-surface-2/60 p-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-fg">
          <ShieldCheck className="size-4 text-success" aria-hidden />
          פרטיות: הכל רץ מקומית
        </div>
        <p className="mt-1 text-2xs leading-4 text-subtle">ללא שרת, ללא טלמטריה וללא שמירת תוכן שהוזן. כל הדוגמאות בדויות.</p>
      </div>
    </div>
  );
}

function Toasts() {
  const { toasts, dismissToast } = useApp();
  return (
    <div className="pointer-events-none fixed bottom-4 start-1/2 z-[60] flex -translate-x-1/2 flex-col items-center gap-2 rtl:translate-x-1/2" aria-live="polite" role="status">
      {toasts.map((t) => {
        const Icon = t.tone === 'success' ? CheckCircle2 : t.tone === 'error' ? AlertCircle : Info;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => dismissToast(t.id)}
            className="card pointer-events-auto flex animate-fade-in items-center gap-2 px-4 py-2.5 text-sm text-fg shadow-2xl"
          >
            <Icon className={cn('size-4', t.tone === 'success' && 'text-success', t.tone === 'error' && 'text-danger', t.tone === 'info' && 'text-info')} aria-hidden />
            {t.message}
          </button>
        );
      })}
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { theme, toggleTheme, markRecent } = useApp();
  const [drawer, setDrawer] = useState(false);
  const [palette, setPalette] = useState(false);
  const location = useLocation();
  const current = moduleByPath(location.pathname);

  useEffect(() => {
    if (current) markRecent(current.id);
    window.scrollTo({ top: 0 });
    setDrawer(false);
  }, [location.pathname, current, markRecent]);

  useEffect(() => {
    document.title = current ? `${current.title} · DRQA` : 'DRQA · Diagnose · Resolve · Quality Assurance';
  }, [current]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPalette((p) => !p);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const closePalette = useCallback(() => setPalette(false), []);

  return (
    <div className="min-h-screen">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[70] focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-on-accent">
        דילוג לתוכן הראשי
      </a>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 start-0 z-30 hidden w-[272px] border-e border-line bg-bg-elevated/80 backdrop-blur-xl lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile drawer */}
      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="תפריט ניווט">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDrawer(false)} aria-hidden />
          <aside className="absolute inset-y-0 start-0 w-[290px] max-w-[85vw] animate-fade-in border-e border-line bg-bg-elevated">
            <button type="button" className="btn btn-ghost btn-icon absolute end-3 top-5" onClick={() => setDrawer(false)} aria-label="סגירת תפריט">
              <X className="size-5" />
            </button>
            <SidebarContent onNavigate={() => setDrawer(false)} />
          </aside>
        </div>
      )}

      <div className="lg:ps-[272px]">
        <header className="sticky top-0 z-20 border-b border-line bg-bg/75 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-3 px-4 md:px-8">
            <button type="button" className="btn btn-ghost btn-icon lg:hidden" onClick={() => setDrawer(true)} aria-label="פתיחת תפריט">
              <Menu className="size-5" />
            </button>
            <div className="lg:hidden">
              <Link to="/" aria-label="DRQA – לוח הבקרה">
                <Logo compact />
              </Link>
            </div>
            <nav aria-label="פירורי לחם" className="hidden min-w-0 items-center gap-1.5 text-sm md:flex">
              <Link to="/" className="text-muted transition hover:text-fg">
                DRQA
              </Link>
              {current && (
                <>
                  <ChevronLeft className="size-4 text-subtle" aria-hidden />
                  <span className="text-2xs font-semibold uppercase tracking-wider text-subtle">{current.group === 'api' ? 'API' : 'QA'}</span>
                  <ChevronLeft className="size-4 text-subtle" aria-hidden />
                  <span className="truncate font-medium text-fg" aria-current="page">
                    {current.title}
                  </span>
                </>
              )}
              {!current && (
                <>
                  <ChevronLeft className="size-4 text-subtle" aria-hidden />
                  <span className="font-medium text-fg" aria-current="page">
                    לוח בקרה
                  </span>
                </>
              )}
            </nav>
            <div className="ms-auto flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPalette(true)}
                className="group flex h-10 items-center gap-2 rounded-xl border border-line bg-surface/70 px-3 text-sm text-subtle transition hover:border-line-strong hover:text-muted md:w-72"
                aria-label="חיפוש (Ctrl+K)"
              >
                <Search className="size-4" aria-hidden />
                <span className="hidden truncate whitespace-nowrap md:inline">חיפוש אבחונים, מונחים, כלים…</span>
                <span className="ms-auto hidden items-center gap-1 md:flex" dir="ltr">
                  <kbd className="kbd">Ctrl</kbd>
                  <kbd className="kbd">K</kbd>
                </span>
              </button>
              <button
                type="button"
                onClick={toggleTheme}
                className="btn btn-secondary btn-icon size-10"
                aria-label={theme === 'dark' ? 'מעבר למצב בהיר' : 'מעבר למצב כהה'}
                title={theme === 'dark' ? 'מצב בהיר' : 'מצב כהה'}
              >
                {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
              </button>
            </div>
          </div>
        </header>

        <main id="main" className="mx-auto max-w-[1440px] px-4 pb-16 pt-6 md:px-8 md:pt-8">
          {children}
        </main>
        <footer className="mx-auto max-w-[1440px] border-t border-line px-4 py-6 text-xs text-subtle md:px-8">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <span dir="ltr" className="text-start">DRQA · Diagnose · Resolve · Quality Assurance</span>
            <span>פרויקט תיק עבודות. כל הנתונים, הנקודות והמשתמשים בדויים (Demo Shop · api.example.com).</span>
          </div>
        </footer>
      </div>

      <CommandPalette open={palette} onClose={closePalette} />
      <Toasts />
    </div>
  );
}
