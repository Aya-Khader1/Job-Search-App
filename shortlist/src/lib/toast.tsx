import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { CheckCircle2, CircleAlert, Info, X } from "lucide-react";

type Kind = "ok" | "error" | "info";
interface ToastItem { id: number; kind: Kind; text: string }
const Ctx = createContext<(text: string, kind?: Kind) => void>(() => {});
export const useToast = () => useContext(Ctx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const push = useCallback((text: string, kind: Kind = "info") => {
    const id = Date.now() + Math.random();
    setItems((xs) => [...xs.slice(-3), { id, kind, text }]);
    setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== id)), kind === "error" ? 9000 : 7000);
  }, []);
  const Icon = { ok: CheckCircle2, error: CircleAlert, info: Info };
  const tone = { ok: "text-ok", error: "text-bad", info: "text-brand" };
  return (
    <Ctx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4" role="status" aria-live="polite">
        {items.map((t) => {
          const I = Icon[t.kind];
          return (
            <div key={t.id} className="toast-in pointer-events-auto flex max-w-md items-start gap-2.5 rounded-xl border border-line bg-surface px-4 py-3 shadow-lg">
              <I size={18} className={`mt-0.5 shrink-0 ${tone[t.kind]}`} />
              <p className="text-sm">{t.text}</p>
              <button aria-label="Dismiss" onClick={() => setItems((xs) => xs.filter((x) => x.id !== t.id))} className="ml-1 text-faint hover:text-ink"><X size={16} /></button>
            </div>
          );
        })}
      </div>
    </Ctx.Provider>
  );
}
