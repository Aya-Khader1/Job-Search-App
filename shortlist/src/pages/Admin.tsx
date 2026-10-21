import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../lib/endpoints";
import { errorText } from "../lib/api";
import { useToast } from "../lib/toast";
import { Avatar, Badge, Button, Empty, ErrorState, PageHead, Panel, Spinner, Tabs, TextInput } from "../components/ui";
import { timeAgo } from "../lib/format";

export default function Admin() {
  const qc = useQueryClient();
  const toast = useToast();
  const [tab, setTab] = useState<"users" | "companies">("users");
  const [term, setTerm] = useState("");
  const q = useQuery({ queryKey: ["admin"], queryFn: adminApi.overview });

  const act = useMutation({
    mutationFn: ({ kind, id }: { kind: "banUser" | "banCompany" | "approve"; id: string }) =>
      kind === "banUser" ? adminApi.banUser(id) : kind === "banCompany" ? adminApi.banCompany(id) : adminApi.approveCompany(id),
    onSuccess: (r) => { toast(r.message, "ok"); qc.invalidateQueries({ queryKey: ["admin"] }); qc.invalidateQueries({ queryKey: ["companies"] }); },
    onError: (e) => toast(errorText(e), "error"),
  });

  const t = term.trim().toLowerCase();
  const users = useMemo(() => (q.data?.users ?? []).filter((u) => `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(t)), [q.data, t]);
  const companies = useMemo(() => (q.data?.companies ?? []).filter((c) => `${c.companyName} ${c.companyEmail} ${c.industry}`.toLowerCase().includes(t)), [q.data, t]);
  const busy = (id: string) => act.isPending && act.variables?.id === id;

  return (
    <div className="mx-auto max-w-5xl">
      <PageHead title="Admin" action={<div className="w-full sm:w-72"><TextInput aria-label="Filter" placeholder="Filter by name or email" value={term} onChange={(e) => setTerm(e.target.value)} /></div>}>
        Moderate accounts and approve companies.
      </PageHead>
      <Tabs value={tab} onChange={setTab} tabs={[{ id: "users", label: `Users (${q.data?.users.length ?? 0})` }, { id: "companies", label: `Companies (${q.data?.companies.length ?? 0})` }]} />
      <div className="mt-5">
        {q.isPending ? <Spinner /> : q.isError ? <ErrorState message={errorText(q.error)} onRetry={() => q.refetch()} /> : tab === "users" ? (
          <Panel className="overflow-hidden">
            {users.length === 0 ? <Empty title="No users found" /> : (
              <ul className="divide-y divide-line">
                {users.map((u) => (
                  <li key={u.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                    <Avatar name={`${u.firstName} ${u.lastName}`} src={u.profilePic?.secure_url} size={38} />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{u.firstName} {u.lastName}</p>
                      <p className="truncate text-sm text-muted">{u.email}{u.createdAt && ` · joined ${timeAgo(u.createdAt)}`}</p>
                    </div>
                    {u.role === "ADMIN" && <Badge tone="brand">Admin</Badge>}
                    {!u.isConfirmed && <Badge tone="warn">Unconfirmed</Badge>}
                    {u.deletedAt && <Badge>Deleted</Badge>}
                    {u.bannedAt && <Badge tone="bad">Banned</Badge>}
                    {u.role !== "ADMIN" && <Button size="sm" variant={u.bannedAt ? "outline" : "ghost"} loading={busy(u.id)} onClick={() => act.mutate({ kind: "banUser", id: u.id })}>{u.bannedAt ? "Unban" : "Ban"}</Button>}
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        ) : (
          <Panel className="overflow-hidden">
            {companies.length === 0 ? <Empty title="No companies found" /> : (
              <ul className="divide-y divide-line">
                {companies.map((c) => (
                  <li key={c.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                    <Avatar square name={c.companyName} src={c.logo?.secure_url} size={38} />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{c.companyName}</p>
                      <p className="truncate text-sm text-muted">{c.industry} · {c.companyEmail}</p>
                    </div>
                    {c.deletedAt && <Badge>Deleted</Badge>}
                    {c.bannedAt && <Badge tone="bad">Banned</Badge>}
                    {c.approvedByAdmin ? <Badge tone="ok">Approved</Badge> : <Button size="sm" variant="marker" loading={busy(c.id)} onClick={() => act.mutate({ kind: "approve", id: c.id })}>Approve</Button>}
                    <Button size="sm" variant={c.bannedAt ? "outline" : "ghost"} loading={busy(c.id)} onClick={() => act.mutate({ kind: "banCompany", id: c.id })}>{c.bannedAt ? "Unban" : "Ban"}</Button>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        )}
      </div>
    </div>
  );
}
