import { useState, type FormEvent } from "react";
import { EMPLOYEE_RANGES, JOB_LOCATIONS, SENIORITY_LEVELS, WORKING_TIMES } from "../lib/types";
import type { Company, Job } from "../lib/types";
import type { CompanyInput, JobInput } from "../lib/endpoints";
import { errorText } from "../lib/api";
import { splitList } from "../lib/format";
import { Button, Field, Select, TextArea, TextInput } from "./ui";
import { levelLabel, placeLabel } from "./JobParts";

export function CompanyForm({ initial, submitLabel, onSubmit }: { initial?: Company; submitLabel: string; onSubmit: (v: CompanyInput) => Promise<unknown> }) {
  const [f, setF] = useState<CompanyInput>({
    companyName: initial?.companyName ?? "", description: initial?.description ?? "", industry: initial?.industry ?? "",
    address: initial?.address ?? "", numberOfEmployees: initial?.numberOfEmployees ?? "1-10", companyEmail: initial?.companyEmail ?? "",
  });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof CompanyInput>(k: K) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(""); setBusy(true);
    try { await onSubmit({ ...f, companyName: f.companyName.trim(), companyEmail: f.companyEmail.trim() }); }
    catch (x) { setErr(errorText(x)); }
    finally { setBusy(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Company name" hint="2 to 25 characters.">{(id) => <TextInput id={id} required minLength={2} maxLength={25} value={f.companyName} onChange={set("companyName")} />}</Field>
        <Field label="Industry">{(id) => <TextInput id={id} required minLength={2} maxLength={40} value={f.industry} onChange={set("industry")} placeholder="Software, healthcare…" />}</Field>
      </div>
      <Field label="Short description" hint={`${f.description.length}/100`}>{(id) => <TextArea id={id} rows={2} required minLength={2} maxLength={100} value={f.description} onChange={set("description")} />}</Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Address">{(id) => <TextInput id={id} required value={f.address} onChange={set("address")} />}</Field>
        <Field label="Company size">{(id) => <Select id={id} value={f.numberOfEmployees} onChange={set("numberOfEmployees")}>{EMPLOYEE_RANGES.map((r) => <option key={r} value={r}>{r} people</option>)}</Select>}</Field>
      </div>
      <Field label="Company email">{(id) => <TextInput id={id} type="email" required value={f.companyEmail} onChange={set("companyEmail")} />}</Field>
      {err && <p role="alert" className="rounded-lg bg-bad-soft px-3 py-2 text-sm text-bad">{err}</p>}
      <div className="flex justify-end"><Button type="submit" loading={busy}>{submitLabel}</Button></div>
    </form>
  );
}

export function JobForm({ initial, submitLabel, onSubmit }: { initial?: Job; submitLabel: string; onSubmit: (v: JobInput) => Promise<unknown> }) {
  const [f, setF] = useState({
    jobTitle: initial?.jobTitle ?? "", jobDescription: initial?.jobDescription ?? "",
    jobLocation: initial?.jobLocation ?? "onsite", workingTime: initial?.workingTime ?? "full-time", seniorityLevel: initial?.seniorityLevel ?? "junior",
    technicalSkills: initial?.technicalSkills.join(", ") ?? "", softSkills: initial?.softSkills.join(", ") ?? "",
  });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const technicalSkills = splitList(f.technicalSkills), softSkills = splitList(f.softSkills);
    if (!technicalSkills.length || !softSkills.length) return setErr("Add at least one technical skill and one soft skill.");
    setErr(""); setBusy(true);
    try { await onSubmit({ ...f, jobTitle: f.jobTitle.trim(), jobDescription: f.jobDescription.trim(), technicalSkills, softSkills, jobLocation: f.jobLocation as JobInput["jobLocation"], workingTime: f.workingTime as JobInput["workingTime"], seniorityLevel: f.seniorityLevel as JobInput["seniorityLevel"] }); }
    catch (x) { setErr(errorText(x)); }
    finally { setBusy(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Job title" hint="3 to 64 characters.">{(id) => <TextInput id={id} required minLength={3} maxLength={64} value={f.jobTitle} onChange={set("jobTitle")} />}</Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Level">{(id) => <Select id={id} value={f.seniorityLevel} onChange={set("seniorityLevel")}>{SENIORITY_LEVELS.map((l) => <option key={l} value={l}>{levelLabel(l)}</option>)}</Select>}</Field>
        <Field label="Schedule">{(id) => <Select id={id} value={f.workingTime} onChange={set("workingTime")}>{WORKING_TIMES.map((l) => <option key={l} value={l}>{l}</option>)}</Select>}</Field>
        <Field label="Location">{(id) => <Select id={id} value={f.jobLocation} onChange={set("jobLocation")}>{JOB_LOCATIONS.map((l) => <option key={l} value={l}>{placeLabel(l)}</option>)}</Select>}</Field>
      </div>
      <Field label="Description" hint={`${f.jobDescription.trim().length}/500 · at least 20 characters`}>{(id) => <TextArea id={id} rows={5} required minLength={20} maxLength={500} value={f.jobDescription} onChange={set("jobDescription")} />}</Field>
      <Field label="Technical skills" hint="Comma separated, for example: React, TypeScript, SQL">{(id) => <TextInput id={id} required value={f.technicalSkills} onChange={set("technicalSkills")} />}</Field>
      <Field label="Soft skills" hint="Comma separated, for example: Communication, Teamwork">{(id) => <TextInput id={id} required value={f.softSkills} onChange={set("softSkills")} />}</Field>
      {err && <p role="alert" className="rounded-lg bg-bad-soft px-3 py-2 text-sm text-bad">{err}</p>}
      <div className="flex justify-end"><Button type="submit" loading={busy}>{submitLabel}</Button></div>
    </form>
  );
}
