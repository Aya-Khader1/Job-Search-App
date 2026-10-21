import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { CheckCheck, Trash2 } from "lucide-react";
import { notificationApi } from "../lib/endpoints";
import { errorText } from "../lib/api";
import { targetFor } from "../lib/notifications";
import { Button, Empty, ErrorState, PageHead, Pagination, Panel, Skeleton, Tabs } from "../components/ui";
import DeviceAlerts from "../components/DeviceAlerts";
import { NotificationItem, useNotificationMutations } from "../components/NotificationBell";

type Filter = "all" | "unread";

export default function Notifications() {
  const nav = useNavigate();
  const [filter, setFilter] = useState<Filter>("all");
  const [page, setPage] = useState(1);
  const { markRead, markAll, remove } = useNotificationMutations();
  const q = useQuery({
    queryKey: ["notifications", filter, page],
    queryFn: () => notificationApi.list({ page, limit: 15, isRead: filter === "unread" ? false : undefined }),
    placeholderData: keepPreviousData,
  });
  const items = q.data?.notifications ?? [];

  return (
    <div className="mx-auto max-w-3xl">
      <PageHead title="Notifications" action={<Button variant="outline" onClick={() => markAll.mutate()} loading={markAll.isPending}><CheckCheck size={16} />Mark all read</Button>}>
        New applications, decisions on yours, and messages.
      </PageHead>
      <DeviceAlerts />
      <Tabs value={filter} onChange={(f) => { setFilter(f); setPage(1); }} tabs={[{ id: "all", label: "All" }, { id: "unread", label: "Unread" }]} />
      <Panel className="mt-5 overflow-hidden">
        {q.isPending ? (
          <ul className="divide-y divide-line">{Array.from({ length: 4 }, (_, i) => <li key={i} className="flex gap-3 px-4 py-4"><Skeleton className="h-9 w-9 !rounded-full" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-1/2" /><Skeleton className="h-3 w-3/4" /></div></li>)}</ul>
        ) : q.isError ? <div className="p-5"><ErrorState message={errorText(q.error)} onRetry={() => q.refetch()} /></div>
          : items.length === 0 ? <Empty title={filter === "unread" ? "Nothing unread" : "No notifications yet"}>{filter === "unread" ? "You're all caught up." : "They'll show up here as things happen."}</Empty>
          : (
            <>
              <ul className={`divide-y divide-line transition-opacity ${q.isPlaceholderData ? "opacity-50" : ""}`}>
                {items.map((n, i) => (
                  <li key={n._id} className="fade-up group relative" style={{ "--d": `${Math.min(i, 8) * 40}ms` } as React.CSSProperties}>
                    <NotificationItem n={n} onOpen={() => { if (!n.isRead) markRead.mutate(n._id); nav(targetFor(n)); }} />
                    <button onClick={() => remove.mutate(n._id)} aria-label="Delete notification"
                      className="absolute right-3 bottom-2.5 rounded-md p-1.5 text-faint opacity-100 transition hover:bg-bad-soft hover:text-bad sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"><Trash2 size={15} /></button>
                  </li>
                ))}
              </ul>
              <Pagination page={page} totalPages={q.data?.pagination.pages ?? 1} onChange={setPage} />
            </>
          )}
      </Panel>
    </div>
  );
}
