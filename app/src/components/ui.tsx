"use client";
import { X } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useId, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from "react";

const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(" ");

// ---------- Button ----------

type Variant = "filled" | "tonal" | "text" | "danger";
const variants: Record<Variant, string> = {
  filled: "bg-accent text-on-accent hover:opacity-90",
  tonal: "bg-accent-soft text-on-accent-soft hover:opacity-90",
  text: "text-accent hover:bg-surface",
  danger: "text-danger hover:bg-surface",
};

export function Button({ variant = "filled", loading, className, children, disabled, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; loading?: boolean }) {
  return (
    <button
      type="button"
      {...rest}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cx("inline-flex h-10 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition-opacity disabled:opacity-40", variants[variant], className)}
    >
      {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />}
      {children}
    </button>
  );
}

export function IconButton({ label, className, children, active, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; active?: boolean }) {
  return (
    <button
      type="button"
      {...rest}
      aria-label={label}
      title={label}
      aria-pressed={active}
      className={cx("inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full hover:bg-surface-2 disabled:opacity-40", active && "bg-accent-soft text-on-accent-soft", className)}
    >
      {children}
    </button>
  );
}

// ---------- Form controls ----------

export function Switch({ checked, onChange, label, description }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string }) {
  return (
    <label className="relative flex min-h-14 cursor-pointer items-center justify-between gap-4 px-4 py-2">
      <span>
        <span className="block text-base">{label}</span>
        {description && <span className="block text-sm text-muted">{description}</span>}
      </span>
      <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer absolute inset-0 h-full w-full cursor-pointer opacity-0" />
      <span aria-hidden className="relative h-7 w-12 shrink-0 rounded-full border-2 border-border-input bg-surface-2 transition-colors after:absolute after:left-1 after:top-1 after:h-4 after:w-4 after:rounded-full after:bg-border-input after:transition-transform peer-checked:border-accent peer-checked:bg-accent peer-checked:after:translate-x-5 peer-checked:after:bg-on-accent peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent" />
    </label>
  );
}

export function Segmented<T extends string>({ value, onChange, options, label }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[]; label: string }) {
  return (
    <fieldset className="px-4 py-2">
      <legend className="mb-2 text-sm text-muted">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <label key={o.value} className={cx("relative cursor-pointer rounded-full border px-4 py-2 text-sm font-medium has-focus-visible:outline has-focus-visible:outline-2 has-focus-visible:outline-accent", value === o.value ? "border-accent bg-accent-soft text-on-accent-soft" : "border-border-input text-text")}>
            <input type="radio" className="absolute inset-0 h-full w-full cursor-pointer opacity-0" checked={value === o.value} onChange={() => onChange(o.value)} />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function TextField({ label, error, className, ...rest }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string | null }) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1 block text-sm text-muted">{label}</label>
      <input id={id} {...rest} aria-invalid={!!error} aria-describedby={error ? `${id}-err` : undefined} className={cx("h-11 w-full rounded-md border bg-bg px-3 text-base text-text", error ? "border-danger" : "border-border-input")} />
      {error && <p id={`${id}-err`} role="alert" className="mt-1 text-sm text-danger">{error}</p>}
    </div>
  );
}

export function Select({ label, value, onChange, options, className }: { label: string; value: string; onChange: (v: string) => void; options: (string | { value: string; label: string })[]; className?: string }) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1 block text-sm text-muted">{label}</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className="h-11 w-full rounded-md border border-border-input bg-bg px-3 text-base text-text">
        {options.map((o) => (typeof o === "string" ? <option key={o}>{o}</option> : <option key={o.value} value={o.value}>{o.label}</option>))}
      </select>
    </div>
  );
}

export function Chip({ selected, onClick, children }: { selected?: boolean; onClick?: () => void; children: ReactNode }) {
  const cls = cx("inline-flex h-8 items-center rounded-md border px-3 text-sm", selected ? "border-accent bg-accent-soft text-on-accent-soft" : "border-border text-text");
  return onClick ? <button type="button" aria-pressed={!!selected} onClick={onClick} className={cls}>{children}</button> : <span className={cls}>{children}</span>;
}

// ---------- Overlays ----------

function useEscape(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open, onClose]);
}

function useFocusOnOpen(open: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    return () => previous?.focus?.();
  }, [open]);
  return ref;
}

export function Dialog({ open, onClose, title, children, actions }: { open: boolean; onClose: () => void; title: string; children: ReactNode; actions?: ReactNode }) {
  useEscape(open, onClose);
  const ref = useFocusOnOpen(open);
  const id = useId();
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={id} className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-lg bg-surface p-6 text-text shadow-pop outline-none">
        <h2 id={id} className="mb-4 text-xl font-semibold">{title}</h2>
        {children}
        {actions && <div className="mt-6 flex flex-wrap justify-end gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  useEscape(open, onClose);
  const ref = useFocusOnOpen(open);
  const id = useId();
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 md:items-stretch md:justify-end md:bg-transparent" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={id} className="max-h-[85dvh] w-full overflow-y-auto rounded-t-lg bg-surface pb-4 text-text shadow-pop outline-none md:max-h-none md:w-[400px] md:rounded-none">
        <div className="sticky top-0 z-10 flex items-center justify-between bg-surface px-4 py-2">
          <h2 id={id} className="text-xl font-semibold">{title}</h2>
          <IconButton label="Close" onClick={onClose}><X size={20} /></IconButton>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Menu({ button, label, children }: { button: ReactNode; label: string; children: (close: () => void) => ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useEscape(open, close);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <IconButton label={label} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>{button}</IconButton>
      {open && <div role="menu" className="absolute right-0 z-40 mt-1 min-w-52 rounded-md bg-surface-2 py-2 shadow-pop">{children(close)}</div>}
    </div>
  );
}

export function MenuItem({ onClick, children, danger }: { onClick: () => void; children: ReactNode; danger?: boolean }) {
  return <button type="button" role="menuitem" onClick={onClick} className={cx("block w-full px-4 py-2 text-left text-sm hover:bg-surface", danger ? "text-danger" : "text-text")}>{children}</button>;
}

// ---------- Feedback ----------

export function EmptyState({ icon, title, body, action }: { icon: ReactNode; title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-24 text-center">
      <div className="text-muted" aria-hidden>{icon}</div>
      <p className="text-xl font-semibold">{title}</p>
      {body && <p className="max-w-sm text-sm text-muted">{body}</p>}
      {action}
    </div>
  );
}

export function Progress({ value, label }: { value: number | null; label: string }) {
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={value === null ? undefined : Math.round(value * 100)} className="h-1 w-full overflow-hidden rounded-full bg-surface-2">
      <div className={cx("h-full bg-accent", value === null && "w-1/3 animate-pulse")} style={value === null ? undefined : { width: `${value * 100}%` }} />
    </div>
  );
}

type Toast = { id: number; message: string; kind: "info" | "error" };
const ToastContext = createContext<(message: string, kind?: Toast["kind"]) => void>(() => {});
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((message: string, kind: Toast["kind"] = "info") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), kind === "error" ? 7000 : 4000);
  }, []);
  return (
    <ToastContext.Provider value={push}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex flex-col items-center gap-2 px-4 md:bottom-6">
        {toasts.map((t) => (
          <div key={t.id} role={t.kind === "error" ? "alert" : "status"} className={cx("pointer-events-auto max-w-md rounded-md px-4 py-3 text-sm shadow-pop", t.kind === "error" ? "bg-danger text-bg" : "bg-text text-bg")}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// ---------- Layout bits ----------

export function TopBar({ title, start, children }: { title: ReactNode; start?: ReactNode; children?: ReactNode }) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-1 bg-bg px-2">
      {start}
      {title ? <h1 className="min-w-0 flex-1 truncate px-2 text-xl font-semibold">{title}</h1> : <div className="flex-1" />}
      {children}
    </header>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="px-4 pb-1 pt-5 text-sm font-semibold text-accent">{children}</h2>;
}
