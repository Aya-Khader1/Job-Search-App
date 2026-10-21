import { useEffect, useId, useRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { ChevronLeft, ChevronRight, CircleAlert, Loader2, X } from "lucide-react";
import { initials } from "../lib/format";

/* ───────── buttons ───────── */
type Variant = "primary" | "outline" | "ghost" | "danger" | "marker";
const variants: Record<Variant, string> = {
  primary: "bg-gradient-to-b from-[#4d4aff] to-brand text-white shadow-[var(--shadow-brand)] hover:brightness-110 hover:-translate-y-px",
  outline: "border border-line bg-surface text-ink hover:border-brand hover:text-brand hover:-translate-y-px hover:shadow-soft",
  ghost: "text-muted hover:bg-brand-soft hover:text-brand",
  danger: "bg-bad text-white hover:bg-[#a31d30]",
  marker: "bg-marker text-ink hover:brightness-95",
};

interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: "sm" | "md";
  loading?: boolean;
}
export function Button({ variant = "primary", size = "md", loading, className = "", children, disabled, ...rest }: BtnProps) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-200 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 ${size === "sm" ? "h-8 px-3 text-[13px]" : "h-10 px-4 text-sm"} ${variants[variant]} ${className}`}
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  );
}

/* ───────── form controls ───────── */
const control = "w-full rounded-lg border border-line bg-surface px-3 text-[15px] text-ink outline-none transition placeholder:text-faint focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:bg-paper";

export function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: (id: string) => ReactNode }) {
  const id = useId();
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium">{label}</label>
      {children(id)}
      {error ? <p className="flex items-center gap-1 text-[13px] text-bad"><CircleAlert size={13} />{error}</p> : hint ? <p className="text-[13px] text-muted">{hint}</p> : null}
    </div>
  );
}
export const TextInput = ({ className = "", ...p }: InputHTMLAttributes<HTMLInputElement>) => <input {...p} className={`${control} h-10 ${className}`} />;
export const TextArea = ({ className = "", ...p }: TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea {...p} className={`${control} py-2 ${className}`} />;
export const Select = ({ className = "", children, ...p }: SelectHTMLAttributes<HTMLSelectElement>) => <select {...p} className={`${control} h-10 ${className}`}>{children}</select>;

/* ───────── badges ───────── */
const tones = {
  neutral: "bg-paper text-muted",
  brand: "bg-brand-soft text-brand-deep",
  ok: "bg-ok-soft text-ok",
  bad: "bg-bad-soft text-bad",
  warn: "bg-warn-soft text-warn",
  marker: "bg-marker-soft text-ink",
};
export function Badge({ tone = "neutral", children }: { tone?: keyof typeof tones; children: ReactNode }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
}
export const statusTone = (s: string) => (s === "accepted" ? "ok" : s === "rejected" ? "bad" : "warn") as keyof typeof tones;

/* ───────── marker highlight ───────── */
export function Highlight({ text, term }: { text: string; term?: string }) {
  const t = term?.trim();
  if (!t) return <>{text}</>;
  const parts = text.split(new RegExp(`(${t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "ig"));
  return <>{parts.map((p, i) => (p.toLowerCase() === t.toLowerCase() ? <mark key={i} className="marker">{p}</mark> : p))}</>;
}

/* ───────── avatar ───────── */
export function Avatar({ name, src, size = 40, square }: { name: string; src?: string; size?: number; square?: boolean }) {
  const shape = square ? "rounded-lg" : "rounded-full";
  return src ? (
    <img src={src} alt="" width={size} height={size} style={{ width: size, height: size }} className={`${shape} shrink-0 border border-line object-cover`} />
  ) : (
    <span style={{ width: size, height: size, fontSize: size * 0.38 }} aria-hidden className={`${shape} font-display inline-flex shrink-0 items-center justify-center bg-brand-soft font-bold text-brand-deep`}>
      {initials(name)}
    </span>
  );
}

/* ───────── modal ───────── */
export function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; prev?.focus(); };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title}
        className={`pop max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-surface shadow-2xl outline-none sm:rounded-3xl ${wide ? "sm:max-w-2xl" : "sm:max-w-md"}`}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-surface px-5 py-3.5">
          <h2 className="text-lg font-bold">{title}</h2>
          <button aria-label="Close" onClick={onClose} className="rounded-md p-1 text-muted hover:bg-paper hover:text-ink"><X size={20} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

/* ───────── states ───────── */
export const Spinner = ({ label = "Loading" }: { label?: string }) => (
  <div className="flex items-center justify-center gap-2 py-16 text-muted" role="status"><Loader2 className="animate-spin" size={18} />{label}</div>
);

export function Empty({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mx-auto max-w-sm py-14 text-center">
      <h3 className="text-lg font-bold">{title}</h3>
      {children && <p className="mt-1.5 text-muted">{children}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="mx-auto max-w-md rounded-xl border border-bad/30 bg-bad-soft p-5 text-center" role="alert">
      <p className="font-semibold text-bad">Couldn't load this</p>
      <p className="mt-1 text-sm text-ink">{message}</p>
      {onRetry && <Button className="mt-3" variant="outline" size="sm" onClick={onRetry}>Try again</Button>}
    </div>
  );
}

export function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <nav className="flex items-center justify-center gap-3 py-4" aria-label="Pagination">
      <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)}><ChevronLeft size={15} />Previous</Button>
      <span className="text-sm text-muted">Page {page} of {totalPages}</span>
      <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>Next<ChevronRight size={15} /></Button>
    </nav>
  );
}

export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: { id: T; label: string }[]; value: T; onChange: (t: T) => void }) {
  return (
    <div role="tablist" className="flex gap-1 overflow-x-auto border-b border-line">
      {tabs.map((t) => (
        <button key={t.id} role="tab" aria-selected={value === t.id} onClick={() => onChange(t.id)}
          className={`-mb-px whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${value === t.id ? "border-brand text-brand" : "border-transparent text-muted hover:text-ink"}`}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

export const Skeleton = ({ className = "" }: { className?: string }) => <div className={`skeleton ${className}`} aria-hidden />;

export function JobRowSkeleton() {
  return (
    <li className="flex gap-3.5 px-5 py-4" aria-hidden>
      <Skeleton className="h-11 w-11 shrink-0 !rounded-xl" />
      <div className="flex-1 space-y-2.5">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
        <div className="flex gap-2"><Skeleton className="h-5 w-20 !rounded-full" /><Skeleton className="h-5 w-16 !rounded-full" /><Skeleton className="h-5 w-16 !rounded-full" /></div>
      </div>
    </li>
  );
}

export const Panel = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <section className={`rounded-3xl border border-white bg-surface shadow-soft ${className}`}>{children}</section>
);

export const PageHead = ({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) => (
  <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
    <div>
      <h1 className="text-3xl font-extrabold sm:text-4xl">{title}</h1>
      {children && <p className="mt-1 max-w-xl text-muted">{children}</p>}
    </div>
    {action}
  </header>
);

export function FileDrop({ accept, multiple, onFiles, label, maxBytes }: { accept: string; multiple?: boolean; onFiles: (f: File[]) => void; label: string; maxBytes: number }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <input ref={ref} type="file" hidden accept={accept} multiple={multiple} onChange={(e) => {
        const files = Array.from(e.target.files ?? []);
        e.target.value = "";
        if (files.length) onFiles(files.filter((f) => f.size <= maxBytes));
      }} />
      <Button variant="outline" size="sm" type="button" onClick={() => ref.current?.click()}>{label}</Button>
    </>
  );
}
