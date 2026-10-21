import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, FileText, MapPin } from "lucide-react";
import type { Company, Job } from "../lib/types";
import { applied, labelOf, MAX_FILE, timeAgo } from "../lib/format";
import { jobApi } from "../lib/endpoints";
import { errorText } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useToast } from "../lib/toast";
import { Avatar, Badge, Button, FileDrop, Highlight, Modal } from "./ui";

export const levelLabel = (l: string) => (l === "fresh" ? "Fresh graduate" : l === "cto" ? "CTO" : labelOf(l));
export const placeLabel = (p: string) => (p === "remotely" ? "Remote" : labelOf(p));

export function JobTags({ job }: { job: Job }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <Badge tone="brand">{levelLabel(job.seniorityLevel)}</Badge>
      <Badge>{labelOf(job.workingTime)}</Badge>
      <Badge><MapPin size={11} className="mr-1" />{placeLabel(job.jobLocation)}</Badge>
      {job.closed && <Badge tone="bad">Closed</Badge>}
    </div>
  );
}

export function JobRow({ job, company, term, selected, isApplied, onSelect, index = 0 }: {
  index?: number; job: Job; company?: Company; term?: string; selected?: boolean; isApplied?: boolean; onSelect: () => void;
}) {
  return (
    <li className="fade-up" style={{ "--d": `${Math.min(index, 10) * 45}ms` } as React.CSSProperties}>
      <button onClick={onSelect} aria-current={selected} className={`group flex w-full gap-3.5 border-l-[3px] px-4 py-4 text-left transition-all duration-200 ${selected ? "border-brand bg-brand-soft/70" : "border-transparent hover:bg-paper hover:pl-5"}`}>
        <Avatar square size={44} name={company?.companyName ?? "?"} src={company?.logo?.secure_url} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-[17px] leading-snug font-bold transition-colors group-hover:text-brand"><Highlight text={job.jobTitle} term={term} /></h3>
            <span className="shrink-0 pt-0.5 text-xs text-faint">{timeAgo(job.createdAt)}</span>
          </div>
          <p className="text-sm text-muted">{company?.companyName ?? "Company"}</p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <JobTags job={job} />
            {isApplied && <Badge tone="ok"><Check size={12} className="mr-1" />Applied</Badge>}
          </div>
          {job.technicalSkills.length > 0 && (
            <p className="mt-2 truncate text-[13px] text-muted">{job.technicalSkills.slice(0, 5).join(" · ")}</p>
          )}
        </div>
      </button>
    </li>
  );
}

function ApplyModal({ job, onClose, onDone }: { job: Job; onClose: () => void; onDone: () => void }) {
  const { user } = useAuth();
  const toast = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [err, setErr] = useState("");

  const m = useMutation({
    mutationFn: () => jobApi.apply(job._id, file!),
    onSuccess: () => { applied.add(user!._id, job._id); toast("Application sent. The company will email you its decision.", "ok"); onDone(); },
    onError: (e) => {
      const text = errorText(e);
      if (/already applied/i.test(text)) { applied.add(user!._id, job._id); onDone(); }
      setErr(text);
    },
  });

  return (
    <Modal title={`Apply: ${job.jobTitle}`} onClose={onClose}>
      <p className="text-sm text-muted">Attach your CV as a PDF (5 MB max). You can apply to each role once.</p>
      <div className="mt-4 flex items-center gap-3 rounded-xl border border-dashed border-line p-4">
        <FileText className="text-brand" />
        <div className="min-w-0 flex-1 text-sm">{file ? <span className="font-semibold">{file.name}</span> : <span className="text-muted">No file chosen</span>}</div>
        <FileDrop accept="application/pdf" maxBytes={MAX_FILE} label={file ? "Change" : "Choose PDF"} onFiles={(f) => {
          if (!f[0]) return setErr("That file is over 5 MB.");
          setErr(""); setFile(f[0]);
        }} />
      </div>
      {err && <p role="alert" className="mt-3 rounded-lg bg-bad-soft px-3 py-2 text-sm text-bad">{err}</p>}
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button disabled={!file} loading={m.isPending} onClick={() => m.mutate()}>Send application</Button>
      </div>
    </Modal>
  );
}

export function JobDetail({ job, company, onBack }: { job: Job; company?: Company; onBack?: () => void }) {
  const { user, isAdmin } = useAuth();
  const qc = useQueryClient();
  const [applying, setApplying] = useState(false);
  const [, force] = useState(0);
  const isApplied = user ? applied.all(user._id).includes(job._id) : false;

  return (
    <article className="p-6">
      {onBack && <button onClick={onBack} className="mb-4 flex items-center gap-1 text-sm font-semibold text-brand lg:hidden"><ArrowLeft size={16} />All jobs</button>}
      <div className="flex items-center gap-3">
        <Avatar square size={48} name={company?.companyName ?? "?"} src={company?.logo?.secure_url} />
        <div>
          {company ? <Link to={`/companies/${company._id}`} className="font-semibold hover:text-brand hover:underline">{company.companyName}</Link> : <span className="font-semibold">Company</span>}
          {company && <p className="text-sm text-muted">{company.industry} · {company.address}</p>}
        </div>
      </div>
      <h2 className="mt-5 text-3xl leading-tight font-extrabold">{job.jobTitle}</h2>
      <div className="mt-3"><JobTags job={job} /></div>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        {isApplied ? (
          <Badge tone="ok"><Check size={12} className="mr-1" />You applied</Badge>
        ) : isAdmin ? (
          <p className="text-sm text-muted">Admin accounts can't apply to jobs.</p>
        ) : (
          <Button disabled={job.closed} onClick={() => setApplying(true)}>{job.closed ? "Applications closed" : "Apply with your CV"}</Button>
        )}
        <span className="text-sm text-faint">Posted {timeAgo(job.createdAt)}</span>
      </div>

      <h3 className="mt-8 text-lg font-bold">About the role</h3>
      <p className="mt-2 max-w-prose whitespace-pre-wrap text-[15px] leading-relaxed">{job.jobDescription}</p>

      {job.technicalSkills.length > 0 && (<>
        <h3 className="mt-7 text-lg font-bold">Technical skills</h3>
        <ul className="mt-2 flex flex-wrap gap-2">{job.technicalSkills.map((s) => <li key={s} className="rounded-md bg-brand-soft px-2.5 py-1 text-sm font-medium text-brand-deep">{s}</li>)}</ul>
      </>)}
      {job.softSkills.length > 0 && (<>
        <h3 className="mt-6 text-lg font-bold">Soft skills</h3>
        <ul className="mt-2 flex flex-wrap gap-2">{job.softSkills.map((s) => <li key={s} className="rounded-md bg-marker-soft px-2.5 py-1 text-sm font-medium">{s}</li>)}</ul>
      </>)}

      {applying && <ApplyModal job={job} onClose={() => setApplying(false)} onDone={() => { setApplying(false); force((n) => n + 1); qc.invalidateQueries({ queryKey: ["jobs"] }); }} />}
    </article>
  );
}
