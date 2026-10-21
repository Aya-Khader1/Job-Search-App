export function timeAgo(iso?: string): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export const fullName = (u?: { firstName?: string; lastName?: string } | null) =>
  [u?.firstName, u?.lastName].filter(Boolean).join(" ") || "Unknown";

export const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "?";

export const labelOf = (v: string) => v.replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase());

export const toDateInput = (iso?: string) => (iso ? new Date(iso).toISOString().slice(0, 10) : "");

export function splitList(text: string): string[] {
  return Array.from(new Set(text.split(",").map((s) => s.trim()).filter(Boolean)));
}

export const MAX_FILE = 5 * 1024 * 1024;

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

/** Jobs a user applied to are remembered on this device, since the backend has no "my applications" endpoint. */
const appliedKey = (uid: string) => `shortlist.applied.${uid}`;
export const applied = {
  all(uid: string): string[] {
    try { return JSON.parse(localStorage.getItem(appliedKey(uid)) ?? "[]"); } catch { return []; }
  },
  add(uid: string, jobId: string) {
    try { localStorage.setItem(appliedKey(uid), JSON.stringify(Array.from(new Set([...applied.all(uid), jobId])))); } catch { /* storage unavailable */ }
  },
};
