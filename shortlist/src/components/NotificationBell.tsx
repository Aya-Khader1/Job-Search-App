import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck } from "lucide-react";
import { notificationApi } from "../lib/endpoints";
import { useRealtime } from "../lib/realtime";
import { iconFor, targetFor } from "../lib/notifications";
import { timeAgo } from "../lib/format";
import DeviceAlerts from "./DeviceAlerts";
import type { AppNotification } from "../lib/types";

/** Shared by the bell and the notifications page. */
export function useNotificationMutations() {
  const qc = useQueryClient();
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["notifications"] });
    qc.invalidateQueries({ queryKey: ["notif-count"] });
  };
  // Refetch on settle either way: the list is the source of truth.
  const markRead = useMutation({ mutationFn: notificationApi.markRead, onSettled: refresh });
  const markAll = useMutation({ mutationFn: notificationApi.markAllRead, onSettled: refresh });
  const remove = useMutation({ mutationFn: notificationApi.remove, onSettled: refresh });
  return { markRead, markAll, remove };
}

export function NotificationItem({ n, onOpen }: { n: AppNotification; onOpen: () => void }) {
  const Icon = iconFor(n);
  return (
    <button onClick={onOpen} className={`flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-paper ${n.isRead ? "" : "bg-brand-soft/50"}`}>
      <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${n.isRead ? "bg-paper text-muted" : "bg-brand text-white"}`}><Icon size={17} /></span>
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-2">
          <span className={`text-sm ${n.isRead ? "font-medium" : "font-bold"}`}>{n.title}</span>
          <span className="shrink-0 text-xs text-faint">{timeAgo(n.createdAt)}</span>
        </span>
        <span className="mt-0.5 line-clamp-2 block text-[13px] text-muted">{n.message}</span>
      </span>
      {!n.isRead && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-brand" aria-label="Unread" />}
    </button>
  );
}

export default function NotificationBell() {
  const { status } = useRealtime();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const { markRead, markAll } = useNotificationMutations();

  // Live updates arrive over the socket; fall back to a slow poll if it's offline.
  const count = useQuery({ queryKey: ["notif-count"], queryFn: notificationApi.unreadCount, refetchInterval: status === "live" ? false : 60_000 });
  const list = useQuery({ queryKey: ["notifications", "bell"], queryFn: () => notificationApi.list({ page: 1, limit: 8 }), enabled: open });
  const unread = count.data ?? 0;

  useEffect(() => {
    if (!open) return;
    const down = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    const key = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", down);
    document.addEventListener("keydown", key);
    return () => { document.removeEventListener("mousedown", down); document.removeEventListener("keydown", key); };
  }, [open]);

  const items = list.data?.notifications ?? [];
  const openItem = (n: AppNotification) => {
    if (!n.isRead) markRead.mutate(n._id);
    setOpen(false);
    nav(targetFor(n));
  };

  return (
    <div ref={box} className="relative">
      <button onClick={() => setOpen((o) => !o)} aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"} aria-expanded={open}
        className="relative rounded-full p-2 text-muted transition-colors hover:bg-white hover:text-ink">
        <Bell size={19} className={unread ? "origin-top animate-[wiggle_0.6s_ease-in-out]" : ""} key={unread} />
        {unread > 0 && (
          <span className="pop absolute top-0.5 right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-marker px-1 text-[11px] font-bold text-ink ring-2 ring-white">{unread > 99 ? "99+" : unread}</span>
        )}
      </button>
      {open && (
        <div className="pop fixed top-14 right-2 left-2 z-50 overflow-hidden rounded-3xl border border-white bg-surface shadow-lift sm:absolute sm:top-full sm:right-0 sm:left-auto sm:mt-2 sm:w-[24rem]">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h2 className="text-base font-bold">Notifications</h2>
            <button disabled={unread === 0 || markAll.isPending} onClick={() => markAll.mutate()} className="inline-flex items-center gap-1 text-[13px] font-semibold text-brand hover:underline disabled:text-faint disabled:no-underline">
              <CheckCheck size={14} />Mark all read
            </button>
          </div>
          <DeviceAlerts compact />
          <div className="max-h-[26rem] overflow-y-auto">
            {list.isPending ? <p className="py-10 text-center text-sm text-muted">Loading…</p>
              : list.isError ? <p className="px-4 py-8 text-center text-sm text-bad">Couldn't load notifications.</p>
              : items.length === 0 ? <p className="px-4 py-10 text-center text-sm text-muted">You're all caught up.</p>
              : <ul className="divide-y divide-line">{items.map((n) => <li key={n._id}><NotificationItem n={n} onOpen={() => openItem(n)} /></li>)}</ul>}
          </div>
          <Link to="/notifications" onClick={() => setOpen(false)} className="block border-t border-line px-4 py-3 text-center text-sm font-semibold text-brand hover:bg-paper">See all notifications</Link>
        </div>
      )}
    </div>
  );
}
