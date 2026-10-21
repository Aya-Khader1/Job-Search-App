import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Users } from "lucide-react";
import { companyApi } from "../lib/endpoints";
import { errorText } from "../lib/api";
import { useCompanies } from "../lib/queries";
import { applied } from "../lib/format";
import { useAuth } from "../lib/auth";
import { Avatar, Empty, ErrorState, Highlight, Modal, PageHead, Panel, Spinner, TextInput } from "../components/ui";
import { JobDetail, JobRow } from "../components/JobParts";
import type { Job } from "../lib/types";

export function Companies() {
  const { data, isPending, isError, error, refetch } = useCompanies();
  const [term, setTerm] = useState("");
  const list = useMemo(() => (data ?? []).filter((c) => !c.bannedAt && `${c.companyName} ${c.industry}`.toLowerCase().includes(term.trim().toLowerCase())), [data, term]);

  return (
    <div>
      <PageHead title="Companies" action={<div className="w-full sm:w-72"><TextInput aria-label="Filter companies" placeholder="Filter by name or industry" value={term} onChange={(e) => setTerm(e.target.value)} /></div>}>
        See who's hiring before you apply.
      </PageHead>
      {isPending ? <Spinner /> : isError ? <ErrorState message={errorText(error)} onRetry={() => refetch()} />
        : list.length === 0 ? <Panel><Empty title={term ? "No company matches" : "No companies yet"}>{term ? "Try a different name." : "Companies appear here once someone registers one."}</Empty></Panel>
        : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((c, i) => (
              <Link key={c._id} style={{ "--d": `${Math.min(i, 12) * 40}ms` } as React.CSSProperties} to={`/companies/${c._id}`} className="group fade-up rounded-3xl border border-white bg-surface p-5 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
                <div className="flex items-center gap-3">
                  <Avatar square size={48} name={c.companyName} src={c.logo?.secure_url} />
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-bold group-hover:text-brand"><Highlight text={c.companyName} term={term} /></h2>
                    <p className="truncate text-sm text-muted">{c.industry}</p>
                  </div>
                </div>
                <p className="mt-3 line-clamp-2 text-sm">{c.description}</p>
                <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-muted">
                  <span className="flex items-center gap-1"><MapPin size={13} />{c.address}</span>
                  <span className="flex items-center gap-1"><Users size={13} />{c.numberOfEmployees}</span>
                </p>
              </Link>
            ))}
          </div>
        )}
    </div>
  );
}

export function CompanyPage() {
  const { id = "" } = useParams();
  const { user } = useAuth();
  const [open, setOpen] = useState<Job | null>(null);
  const q = useQuery({ queryKey: ["company", id], queryFn: () => companyApi.get(id) });

  if (q.isPending) return <Spinner />;
  if (q.isError) return <ErrorState message={errorText(q.error)} onRetry={() => q.refetch()} />;
  const c = q.data;
  const jobs = [...(c.jobs ?? [])].sort((a, b) => Number(!!a.closed) - Number(!!b.closed));
  const appliedIds = user ? applied.all(user._id) : [];
  const mine = c.createdBy === user?._id;

  return (
    <div className="mx-auto max-w-4xl">
      <Link to="/companies" className="text-sm font-semibold text-brand hover:underline">All companies</Link>
      <Panel className="mt-3 overflow-hidden">
        {c.coverPic?.[0] && <img src={c.coverPic[0].secure_url} alt="" className="h-40 w-full object-cover sm:h-56" />}
        <div className="flex flex-wrap items-start gap-4 p-6">
          <Avatar square size={64} name={c.companyName} src={c.logo?.secure_url} />
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-extrabold">{c.companyName}</h1>
            <p className="text-muted">{c.industry}</p>
            <p className="mt-3 max-w-prose">{c.description}</p>
            <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted">
              <span className="flex items-center gap-1"><MapPin size={14} />{c.address}</span>
              <span className="flex items-center gap-1"><Users size={14} />{c.numberOfEmployees} people</span>
              <a className="hover:text-brand hover:underline" href={`mailto:${c.companyEmail}`}>{c.companyEmail}</a>
            </p>
          </div>
          {mine && <Link to={`/employer/${c._id}`} className="rounded-lg border border-line px-3 py-2 text-sm font-semibold hover:border-brand hover:text-brand">Manage company</Link>}
        </div>
      </Panel>

      <h2 className="mt-8 mb-3 text-xl font-bold">Open roles ({jobs.filter((j) => !j.closed).length})</h2>
      <Panel className="overflow-hidden">
        {jobs.length === 0 ? <Empty title="No roles posted">This company hasn't posted a job yet.</Empty> : (
          <ul className="divide-y divide-line">
            {jobs.map((j) => <JobRow key={j._id} job={j} company={c} isApplied={appliedIds.includes(j._id)} onSelect={() => setOpen(j)} />)}
          </ul>
        )}
      </Panel>
      {open && <Modal wide title={open.jobTitle} onClose={() => setOpen(null)}><div className="-m-5"><JobDetail job={open} company={c} /></div></Modal>}
    </div>
  );
}
