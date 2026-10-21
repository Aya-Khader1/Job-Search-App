import { useEffect, useMemo, useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ChevronDown, Code2, Search, X } from "lucide-react";
import { jobApi } from "../lib/endpoints";
import { errorText } from "../lib/api";
import { useCompanies } from "../lib/queries";
import { useAuth } from "../lib/auth";
import { applied, labelOf } from "../lib/format";
import { JOB_LOCATIONS, SENIORITY_LEVELS, WORKING_TIMES } from "../lib/types";
import type { JobLocation, SeniorityLevel, WorkingTime } from "../lib/types";
import { Empty, ErrorState, JobRowSkeleton, Pagination, Panel, Button } from "../components/ui";
import { JobDetail, JobRow, levelLabel, placeLabel } from "../components/JobParts";

const LIMIT = 10;
const delay = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active}
      className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-all duration-200 active:scale-95 ${active ? "border-white bg-white text-brand shadow-lg" : "border-white/25 bg-white/10 text-white hover:bg-white/20"}`}>
      {children}
    </button>
  );
}

export default function Jobs() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const level = (params.get("level") ?? "") as SeniorityLevel | "";
  const time = (params.get("time") ?? "") as WorkingTime | "";
  const place = (params.get("place") ?? "") as JobLocation | "";
  const title = params.get("title") ?? "";
  const skills = params.get("skills") ?? "";
  const page = Math.max(1, Number(params.get("page") ?? 1));
  const selectedId = params.get("job");

  const [draft, setDraft] = useState({ title, skills });
  useEffect(() => setDraft({ title, skills }), [title, skills]);

  const { byId: companies, data: companyList } = useCompanies();
  const q = useQuery({
    queryKey: ["jobs", level, time, place, title, skills, page],
    queryFn: () => jobApi.search({ page, limit: LIMIT, seniorityLevel: level, workingTime: time, jobLocation: place, jobTitle: title, technicalSkills: skills }),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });

  const jobs = q.data?.jobs ?? [];
  // On wide screens the detail panel is always filled: fall back to the first result.
  const [wide, setWide] = useState(() => window.matchMedia("(min-width: 1024px)").matches);
  useEffect(() => {
    const m = window.matchMedia("(min-width: 1024px)");
    const on = () => setWide(m.matches);
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);
  const selected = useMemo(() => jobs.find((j) => j._id === selectedId) ?? (wide ? jobs[0] ?? null : null), [jobs, selectedId, wide]);
  const appliedIds = user ? applied.all(user._id) : [];

  const update = (next: Record<string, string | undefined>) => {
    const p = new URLSearchParams(params);
    for (const [k, v] of Object.entries(next)) (v ? p.set(k, v) : p.delete(k));
    p.delete("page"); p.delete("job");
    for (const [k, v] of Object.entries(next)) if ((k === "page" || k === "job") && v) p.set(k, v);
    setParams(p, { replace: true });
  };
  const search = (e: FormEvent) => { e.preventDefault(); update({ title: draft.title.trim(), skills: draft.skills.trim() }); };
  const hasFilters = !!(level || time || place || title || skills);
  const total = q.data?.pagination.totalJobs ?? jobs.length;

  return (
    <div>
      {/* ───── hero + search ───── */}
      <section className="relative mb-8 overflow-hidden rounded-[32px] bg-gradient-to-br from-[#2623d6] via-brand to-[#6f3cf2] p-6 text-white shadow-lift sm:p-10">
        <div className="hero-grid absolute inset-0" aria-hidden />
        <div className="blob absolute -top-24 -right-12 h-72 w-72 rounded-full bg-marker/40 blur-3xl" aria-hidden />
        <div className="blob absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-[#ff7ac6]/30 blur-3xl" style={{ animationDelay: "-7s" }} aria-hidden />
        <div className="relative">
          <p className="fade-up text-sm font-semibold text-white/80">{greeting()}, {user?.firstName}</p>
          <h1 className="fade-up mt-2 max-w-3xl text-4xl leading-[1.08] font-extrabold sm:text-6xl" style={delay(70)}>
            Find the role that{" "}
            <span className="pop inline-block -rotate-1 rounded-2xl bg-marker px-3 text-ink" style={{ animationDelay: "450ms" }}>fits you.</span>
          </h1>
          <p className="fade-up mt-3 text-white/80" style={delay(140)}>
            {companyList?.length ? `Open roles from ${companyList.length} ${companyList.length === 1 ? "company" : "companies"}.` : "Browse open roles."} Apply with a PDF and hear back by email.
          </p>

          <form onSubmit={search} className="fade-up mt-7 flex flex-col gap-1 rounded-3xl bg-white p-2 text-ink shadow-2xl transition focus-within:ring-4 focus-within:ring-white/30 sm:flex-row sm:items-center sm:rounded-full" style={delay(210)}>
            <label className="flex flex-1 items-center gap-2.5 px-4 py-2">
              <Search size={18} className="shrink-0 text-brand" />
              <input aria-label="Job title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Job title, e.g. React Developer"
                className="w-full bg-transparent text-base outline-none placeholder:text-faint" />
            </label>
            <span className="hidden h-7 w-px bg-line sm:block" />
            <label className="flex flex-1 items-center gap-2.5 px-4 py-2">
              <Code2 size={18} className="shrink-0 text-brand" />
              <input aria-label="Technical skills, comma separated" value={draft.skills} onChange={(e) => setDraft({ ...draft, skills: e.target.value })} placeholder="Skills, e.g. React, SQL"
                className="w-full bg-transparent text-base outline-none placeholder:text-faint" />
            </label>
            <Button type="submit" className="h-12 rounded-full px-8 text-[15px]">Search</Button>
          </form>

          <div className="fade-up mt-4 flex flex-wrap items-center gap-2" style={delay(280)} role="group" aria-label="Filters">
            {WORKING_TIMES.map((t) => <Chip key={t} active={time === t} onClick={() => update({ time: time === t ? undefined : t })}>{labelOf(t)}</Chip>)}
            <span className="mx-1 hidden h-5 w-px bg-white/25 sm:block" />
            {JOB_LOCATIONS.map((l) => <Chip key={l} active={place === l} onClick={() => update({ place: place === l ? undefined : l })}>{placeLabel(l)}</Chip>)}
            <span className="mx-1 hidden h-5 w-px bg-white/25 sm:block" />
            <span className="relative">
              <select aria-label="Seniority level" value={level} onChange={(e) => update({ level: e.target.value || undefined })}
                className={`cursor-pointer appearance-none rounded-full border py-1.5 pr-8 pl-3.5 text-sm font-semibold transition-all duration-200 ${level ? "border-white bg-white text-brand shadow-lg" : "border-white/25 bg-white/10 text-white hover:bg-white/20"}`}>
                <option value="" className="text-ink">Any level</option>
                {SENIORITY_LEVELS.map((l) => <option key={l} value={l} className="text-ink">{levelLabel(l)}</option>)}
              </select>
              <ChevronDown size={15} className={`pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 ${level ? "text-brand" : "text-white"}`} />
            </span>
            {hasFilters && (
              <button type="button" onClick={() => setParams({}, { replace: true })} className="pop ml-1 inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold text-white/90 hover:bg-white/15">
                <X size={14} />Clear all
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ───── results ───── */}
      <p className="mb-3 text-sm text-muted" aria-live="polite">
        {q.data ? <><strong className="text-base text-ink">{total}</strong> {total === 1 ? "role" : "roles"}{hasFilters ? " match your filters" : " open now"}</> : "\u00a0"}
      </p>

      {q.isPending ? (
        <Panel className="overflow-hidden lg:max-w-[42%]"><ul className="divide-y divide-line">{Array.from({ length: 5 }, (_, i) => <JobRowSkeleton key={i} />)}</ul></Panel>
      ) : q.isError ? <ErrorState message={errorText(q.error)} onRetry={() => q.refetch()} />
        : jobs.length === 0 ? (
          <Panel><Empty title="No roles match yet" action={hasFilters ? <Button variant="outline" onClick={() => setParams({}, { replace: true })}>Clear filters</Button> : undefined}>
            {hasFilters ? "Try a shorter title, or remove a filter." : "No jobs have been posted yet. Employers can post a role from the For employers page."}
          </Empty></Panel>
        ) : (
          <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
            <Panel className={`overflow-hidden transition-opacity duration-200 ${q.isPlaceholderData ? "opacity-50" : ""}`}>
              <ul className="divide-y divide-line">
                {jobs.map((j, i) => (
                  <JobRow key={j._id} index={i} job={j} company={companies.get(j.companyId)} term={title} selected={j._id === selected?._id}
                    isApplied={appliedIds.includes(j._id)} onSelect={() => update({ job: j._id, ...(page > 1 ? { page: String(page) } : {}) })} />
                ))}
              </ul>
              <Pagination page={page} totalPages={q.data.pagination.totalPages} onChange={(p) => update({ page: p > 1 ? String(p) : undefined })} />
            </Panel>

            <div className="sticky top-20 hidden max-h-[calc(100vh-6rem)] overflow-y-auto rounded-3xl border border-white bg-surface shadow-soft lg:block">
              {selected ? (
                <div key={selected._id} className="slide-in"><JobDetail job={selected} company={companies.get(selected.companyId)} /></div>
              ) : <Empty title="Pick a role">Select a job on the left to read the full description and apply.</Empty>}
            </div>
            {selected && (
              <div className="slide-in fixed inset-0 z-40 overflow-y-auto bg-surface lg:hidden">
                <JobDetail job={selected} company={companies.get(selected.companyId)} onBack={() => update({ job: undefined, ...(page > 1 ? { page: String(page) } : {}) })} />
              </div>
            )}
          </div>
        )}
    </div>
  );
}
