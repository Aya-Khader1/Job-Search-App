import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, MessageSquare, Pencil, Plus, Trash2, FileText } from "lucide-react";
import { companyApi, jobApi } from "../lib/endpoints";
import { errorText } from "../lib/api";
import { useCompanies } from "../lib/queries";
import { useAuth } from "../lib/auth";
import { useToast } from "../lib/toast";
import { downloadBlob, fullName, labelOf, MAX_FILE, timeAgo } from "../lib/format";
import type { Application, ApplicantInfo, Company, Job } from "../lib/types";
import { Avatar, Badge, Button, Empty, ErrorState, Field, FileDrop, Modal, PageHead, Pagination, Panel, Select, Spinner, statusTone, Tabs, TextInput } from "../components/ui";
import { CompanyForm, JobForm } from "../components/Forms";
import { JobTags } from "../components/JobParts";

/* ───────── my companies ───────── */
export function Employer() {
  const { user, isAdmin } = useAuth();
  const { data, isPending, isError, error, refetch } = useCompanies();
  const qc = useQueryClient();
  const nav = useNavigate();
  const toast = useToast();
  const [creating, setCreating] = useState(false);
  const mine = (data ?? []).filter((c) => c.createdBy === user?._id || c.HRs?.includes(user?._id ?? ""));

  return (
    <div className="mx-auto max-w-4xl">
      <PageHead title="Your companies" action={<Button onClick={() => setCreating(true)}><Plus size={16} />New company</Button>}>
        Post roles, review applicants and message candidates.
      </PageHead>
      {isPending ? <Spinner /> : isError ? <ErrorState message={errorText(error)} onRetry={() => refetch()} />
        : mine.length === 0 ? (
          <Panel><Empty title="You don't manage a company yet" action={<Button onClick={() => setCreating(true)}>Register a company</Button>}>
            Register one to start posting jobs. {isAdmin && "Admins can manage any company from the Admin page."}
          </Empty></Panel>
        ) : (
          <ul className="space-y-3">
            {mine.map((c) => (
              <li key={c._id}>
                <Link to={`/employer/${c._id}`} className="flex items-center gap-4 rounded-3xl border border-white bg-surface p-4 shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lift">
                  <Avatar square size={52} name={c.companyName} src={c.logo?.secure_url} />
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-bold">{c.companyName}</h2>
                    <p className="truncate text-sm text-muted">{c.industry} · {c.address}</p>
                  </div>
                  {c.bannedAt ? <Badge tone="bad">Banned</Badge> : c.approvedByAdmin ? <Badge tone="ok">Approved</Badge> : <Badge tone="warn">Awaiting admin approval</Badge>}
                </Link>
              </li>
            ))}
          </ul>
        )}
      {creating && (
        <Modal title="Register a company" onClose={() => setCreating(false)} wide>
          <CompanyForm submitLabel="Create company" onSubmit={async (v) => {
            const { newCompany } = await companyApi.add(v);
            await qc.invalidateQueries({ queryKey: ["companies"] });
            toast(`${newCompany.companyName} created.`, "ok");
            nav(`/employer/${newCompany._id}`);
          }} />
        </Modal>
      )}
    </div>
  );
}

/* ───────── manage one company ───────── */
type TabId = "jobs" | "applications" | "branding" | "settings";

export function EmployerCompany() {
  const { id = "" } = useParams();
  const { user, isAdmin } = useAuth();
  const [tab, setTab] = useState<TabId>("jobs");
  const q = useQuery({ queryKey: ["company", id], queryFn: () => companyApi.get(id) });

  if (q.isPending) return <Spinner />;
  if (q.isError) return <ErrorState message={errorText(q.error)} onRetry={() => q.refetch()} />;
  const c = q.data;
  const allowed = isAdmin || c.createdBy === user?._id || c.HRs?.includes(user?._id ?? "");
  if (!allowed) return <Panel><Empty title="You don't manage this company" action={<Link className="font-semibold text-brand" to={`/companies/${id}`}>View public page</Link>} /></Panel>;

  return (
    <div className="mx-auto max-w-5xl">
      <Link to="/employer" className="text-sm font-semibold text-brand hover:underline">Your companies</Link>
      <div className="mt-3 mb-6 flex flex-wrap items-center gap-4">
        <Avatar square size={56} name={c.companyName} src={c.logo?.secure_url} />
        <div className="flex-1">
          <h1 className="text-3xl font-extrabold">{c.companyName}</h1>
          <Link to={`/companies/${id}`} className="text-sm text-muted hover:text-brand hover:underline">View public page</Link>
        </div>
        {c.bannedAt ? <Badge tone="bad">Banned</Badge> : c.approvedByAdmin ? <Badge tone="ok">Approved</Badge> : <Badge tone="warn">Awaiting admin approval</Badge>}
      </div>
      <Tabs value={tab} onChange={setTab} tabs={[
        { id: "jobs", label: `Jobs (${c.jobs?.length ?? 0})` }, { id: "applications", label: "Applications" },
        { id: "branding", label: "Logo and covers" }, { id: "settings", label: "Settings" },
      ]} />
      <div className="mt-6">
        {tab === "jobs" && <JobsTab company={c} />}
        {tab === "applications" && <ApplicationsTab company={c} />}
        {tab === "branding" && <BrandingTab company={c} />}
        {tab === "settings" && <SettingsTab company={c} />}
      </div>
    </div>
  );
}

function useRefreshCompany(id: string) {
  const qc = useQueryClient();
  return async () => { await Promise.all([qc.invalidateQueries({ queryKey: ["company", id] }), qc.invalidateQueries({ queryKey: ["companies"] }), qc.invalidateQueries({ queryKey: ["jobs"] })]); };
}

/* jobs */
function JobsTab({ company }: { company: Company }) {
  const refresh = useRefreshCompany(company._id);
  const toast = useToast();
  const [editing, setEditing] = useState<Job | "new" | null>(null);
  const [deleting, setDeleting] = useState<Job | null>(null);
  const jobs = [...(company.jobs ?? [])].sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));

  const toggle = useMutation({
    mutationFn: (j: Job) => jobApi.update(company._id, j._id, { closed: !j.closed }),
    onSuccess: async (_, j) => { await refresh(); toast(j.closed ? "Job reopened." : "Job closed to new applications.", "ok"); },
    onError: (e) => toast(errorText(e), "error"),
  });
  const del = useMutation({
    mutationFn: (j: Job) => jobApi.remove(company._id, j._id),
    onSuccess: async () => { await refresh(); setDeleting(null); toast("Job deleted along with its applications.", "ok"); },
    onError: (e) => toast(errorText(e), "error"),
  });

  return (
    <div>
      <div className="mb-4 flex justify-end"><Button onClick={() => setEditing("new")}><Plus size={16} />Post a job</Button></div>
      <Panel className="overflow-hidden">
        {jobs.length === 0 ? <Empty title="No jobs posted" action={<Button onClick={() => setEditing("new")}>Post your first job</Button>}>Candidates will find it in search once it's live.</Empty> : (
          <ul className="divide-y divide-line">
            {jobs.map((j) => (
              <li key={j._id} className="flex flex-wrap items-center gap-3 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold">{j.jobTitle}</h3>
                  <div className="mt-1.5"><JobTags job={j} /></div>
                  <p className="mt-1.5 text-xs text-faint">Posted {timeAgo(j.createdAt)}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => toggle.mutate(j)} loading={toggle.isPending && toggle.variables?._id === j._id}>{j.closed ? "Reopen" : "Close"}</Button>
                <Button size="sm" variant="ghost" aria-label={`Edit ${j.jobTitle}`} onClick={() => setEditing(j)}><Pencil size={15} /></Button>
                <Button size="sm" variant="ghost" aria-label={`Delete ${j.jobTitle}`} onClick={() => setDeleting(j)}><Trash2 size={15} /></Button>
              </li>
            ))}
          </ul>
        )}
      </Panel>
      {editing && (
        <Modal wide title={editing === "new" ? "Post a job" : "Edit job"} onClose={() => setEditing(null)}>
          <JobForm initial={editing === "new" ? undefined : editing} submitLabel={editing === "new" ? "Post job" : "Save changes"} onSubmit={async (v) => {
            if (editing === "new") await jobApi.add(company._id, v); else await jobApi.update(company._id, editing._id, v);
            await refresh(); setEditing(null); toast(editing === "new" ? "Job posted." : "Job updated.", "ok");
          }} />
        </Modal>
      )}
      {deleting && (
        <Modal title="Delete this job?" onClose={() => setDeleting(null)}>
          <p className="text-sm">"{deleting.jobTitle}" and every application sent to it will be removed. This can't be undone.</p>
          <div className="mt-5 flex justify-end gap-2"><Button variant="ghost" onClick={() => setDeleting(null)}>Keep job</Button><Button variant="danger" loading={del.isPending} onClick={() => del.mutate(deleting)}>Delete job</Button></div>
        </Modal>
      )}
    </div>
  );
}

/* applications */
const applicantOf = (a: Application): ApplicantInfo => (typeof a.userId === "object" ? a.userId : a.user ?? { _id: a.userId });

function ApplicationsTab({ company }: { company: Company }) {
  const toast = useToast();
  const qc = useQueryClient();
  const jobs = company.jobs ?? [];
  const [jobId, setJobId] = useState(jobs[0]?._id ?? "");
  const [page, setPage] = useState(1);
  const q = useQuery({ queryKey: ["applications", company._id, jobId, page], queryFn: () => jobApi.applications(company._id, jobId, page, 10), enabled: !!jobId });

  const decide = useMutation({
    mutationFn: ({ a, status }: { a: Application; status: "accepted" | "rejected" }) => jobApi.setStatus(company._id, a._id, status),
    onSuccess: (_, v) => { qc.invalidateQueries({ queryKey: ["applications"] }); toast(`Application ${v.status}. The applicant has been emailed.`, "ok"); },
    onError: (e) => toast(errorText(e), "error"),
  });

  if (jobs.length === 0) return <Panel><Empty title="No jobs yet">Post a job to start receiving applications.</Empty></Panel>;
  const err = q.isError ? errorText(q.error) : "";

  return (
    <div>
      <div className="mb-4 max-w-sm">
        <Field label="Job">{(fid) => <Select id={fid} value={jobId} onChange={(e) => { setJobId(e.target.value); setPage(1); }}>{jobs.map((j) => <option key={j._id} value={j._id}>{j.jobTitle}</option>)}</Select>}</Field>
      </div>
      {q.isPending ? <Spinner /> : q.isError ? (
        <div>
          <ErrorState message={err} onRetry={() => q.refetch()} />
          {/populate/i.test(err) && <p className="mx-auto mt-3 max-w-md text-center text-sm text-muted">This comes from the backend: the applications query populates a path named "user", which the Application schema doesn't have. Changing it to "userId" fixes it (see the README).</p>}
        </div>
      ) : q.data.applications.length === 0 ? <Panel><Empty title="No applications yet">They'll appear here, and you'll get a live notification when one arrives.</Empty></Panel> : (
        <Panel className="overflow-hidden">
          <ul className="divide-y divide-line">
            {q.data.applications.map((a) => {
              const p = applicantOf(a);
              const name = p.firstName ? fullName(p) : "Applicant";
              return (
                <li key={a._id} className="flex flex-wrap items-center gap-3 px-5 py-4">
                  <Avatar name={name} src={p.profilePic?.secure_url} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{name}</p>
                    <p className="truncate text-sm text-muted">{p.email ?? `ID ${p._id}`} · applied {timeAgo(a.createdAt)}</p>
                  </div>
                  <Badge tone={statusTone(a.status)}>{labelOf(a.status)}</Badge>
                  <a href={a.userCV.secure_url} target="_blank" rel="noreferrer" className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line px-3 text-[13px] font-semibold hover:border-brand hover:text-brand"><FileText size={14} />CV</a>
                  <Link to={`/messages?to=${p._id}&name=${encodeURIComponent(name)}&company=${company._id}`} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line px-3 text-[13px] font-semibold hover:border-brand hover:text-brand"><MessageSquare size={14} />Message</Link>
                  <Button size="sm" variant="outline" disabled={a.status === "accepted"} loading={decide.isPending && decide.variables?.a._id === a._id && decide.variables.status === "accepted"} onClick={() => decide.mutate({ a, status: "accepted" })}>Accept</Button>
                  <Button size="sm" variant="ghost" disabled={a.status === "rejected"} loading={decide.isPending && decide.variables?.a._id === a._id && decide.variables.status === "rejected"} onClick={() => decide.mutate({ a, status: "rejected" })}>Reject</Button>
                </li>
              );
            })}
          </ul>
          <Pagination page={page} totalPages={q.data.pagination.totalPages} onChange={setPage} />
        </Panel>
      )}
    </div>
  );
}

/* logo + covers */
function BrandingTab({ company }: { company: Company }) {
  const refresh = useRefreshCompany(company._id);
  const toast = useToast();
  const run = (label: string, fn: () => Promise<unknown>) => async () => {
    try { await fn(); await refresh(); toast(label, "ok"); } catch (e) { toast(errorText(e), "error"); }
  };
  const pick = (fn: (f: File[]) => Promise<unknown>, label: string) => (files: File[]) => {
    if (!files.length) return toast("Images must be 5 MB or smaller.", "error");
    run(label, () => fn(files))();
  };

  return (
    <div className="grid gap-5 md:grid-cols-[18rem_1fr]">
      <Panel className="p-5">
        <h2 className="font-bold">Logo</h2>
        <div className="mt-3"><Avatar square size={112} name={company.companyName} src={company.logo?.secure_url} /></div>
        <p className="mt-2 text-xs text-muted">PNG, JPG or GIF, up to 5 MB.</p>
        <div className="mt-3 flex gap-2">
          <FileDrop accept="image/png,image/jpeg,image/gif" maxBytes={MAX_FILE} label={company.logo ? "Replace" : "Upload logo"} onFiles={pick((f) => companyApi.uploadLogo(company._id, f[0]), "Logo updated.")} />
          {company.logo && <Button size="sm" variant="ghost" onClick={run("Logo removed.", () => companyApi.deleteLogo(company._id))}>Remove</Button>}
        </div>
      </Panel>
      <Panel className="p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">Cover pictures</h2>
          <FileDrop accept="image/png,image/jpeg,image/gif" multiple maxBytes={MAX_FILE} label="Add pictures" onFiles={pick((f) => companyApi.uploadCovers(company._id, f.slice(0, 5)), "Pictures added.")} />
        </div>
        {(company.coverPic?.length ?? 0) === 0 ? <p className="mt-4 text-sm text-muted">No covers yet. The first one appears at the top of your public page.</p> : (
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {company.coverPic!.map((p) => (
              <li key={p.public_id} className="group relative overflow-hidden rounded-xl border border-line">
                <img src={p.secure_url} alt="" className="aspect-video w-full object-cover" />
                <button aria-label="Delete cover picture" onClick={run("Picture removed.", () => companyApi.deleteCover(company._id, p.public_id))} className="absolute top-2 right-2 rounded-md bg-surface/90 p-1.5 text-bad shadow hover:bg-surface"><Trash2 size={15} /></button>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

/* settings, export, delete */
function SettingsTab({ company }: { company: Company }) {
  const refresh = useRefreshCompany(company._id);
  const toast = useToast();
  const nav = useNavigate();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [exporting, setExporting] = useState(false);
  const [confirm, setConfirm] = useState(false);

  const exportXlsx = async () => {
    setExporting(true);
    try { downloadBlob(await companyApi.exportApplications(company._id, date), `applications-${date}.xlsx`); }
    catch (e) { toast(errorText(e), "error"); }
    finally { setExporting(false); }
  };

  return (
    <div className="grid max-w-3xl gap-5">
      <Panel className="p-5">
        <h2 className="mb-4 font-bold">Company details</h2>
        <CompanyForm initial={company} submitLabel="Save changes" onSubmit={async (v) => { await companyApi.update(company._id, v); await refresh(); toast("Company updated.", "ok"); }} />
      </Panel>
      <Panel className="p-5">
        <h2 className="font-bold">Export applications</h2>
        <p className="mt-1 text-sm text-muted">Download an Excel sheet of every application received on one day.</p>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <Field label="Day">{(id) => <TextInput id={id} type="date" max={new Date().toISOString().slice(0, 10)} value={date} onChange={(e) => setDate(e.target.value)} />}</Field>
          <Button variant="outline" loading={exporting} onClick={exportXlsx}><Download size={16} />Download .xlsx</Button>
        </div>
      </Panel>
      <Panel className="border-bad/30 p-5">
        <h2 className="font-bold text-bad">Delete company</h2>
        <p className="mt-1 text-sm text-muted">The company disappears from search and its page stops working.</p>
        <Button className="mt-3" variant="danger" onClick={() => setConfirm(true)}>Delete company</Button>
      </Panel>
      {confirm && (
        <Modal title={`Delete ${company.companyName}?`} onClose={() => setConfirm(false)}>
          <p className="text-sm">This removes the company from Shortlist. Your jobs will no longer be reachable.</p>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setConfirm(false)}>Keep company</Button>
            <Button variant="danger" onClick={async () => { try { await companyApi.remove(company._id); await refresh(); toast("Company deleted.", "ok"); nav("/employer"); } catch (e) { toast(errorText(e), "error"); } }}>Delete company</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
