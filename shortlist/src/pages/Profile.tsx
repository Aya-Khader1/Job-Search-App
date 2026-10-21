import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { userApi } from "../lib/endpoints";
import { errorText } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useToast } from "../lib/toast";
import { fullName, MAX_FILE, toDateInput } from "../lib/format";
import { Avatar, Badge, Button, Field, FileDrop, Modal, PageHead, Panel, Select, TextInput } from "../components/ui";

export default function Profile() {
  const { user, reload, logout } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const u = user!;

  const [f, setF] = useState({ firstName: u.firstName ?? "", lastName: u.lastName ?? "", mobileNumber: u.mobileNumber ?? "", DOB: toDateInput(u.DOB), gender: u.gender ?? "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [pw, setPw] = useState({ oldPassword: "", newPassword: "" });
  const [pwBusy, setPwBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);

  const act = async (okText: string, fn: () => Promise<unknown>) => {
    try { await fn(); await reload(); toast(okText, "ok"); } catch (e) { toast(errorText(e), "error"); }
  };
  const images = (fn: (f: File[]) => Promise<unknown>, ok: string) => (files: File[]) =>
    files.length ? act(ok, () => fn(files)) : toast("Images must be 5 MB or smaller.", "error");

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!f.DOB) return setErr("Date of birth is required. You must be at least 18.");
    if (f.mobileNumber && !/^\+?[1-9]\d{7,14}$/.test(f.mobileNumber)) return setErr("Mobile number: digits only, with country code.");
    setErr(""); setBusy(true);
    try {
      await userApi.update({
        DOB: f.DOB,
        ...(f.firstName && { firstName: f.firstName }), ...(f.lastName && { lastName: f.lastName }),
        ...(f.mobileNumber && { mobileNumber: f.mobileNumber }), ...(f.gender && { gender: f.gender as "MALE" | "FEMALE" }),
      });
      await reload(); toast("Profile saved.", "ok");
    } catch (x) { setErr(errorText(x)); } finally { setBusy(false); }
  };

  const changePw = async (e: FormEvent) => {
    e.preventDefault(); setPwBusy(true);
    try {
      await userApi.updatePassword(pw);
      toast("Password changed. Sign in again with the new one.", "ok");
      logout(); nav("/login");
    } catch (x) { toast(errorText(x), "error"); } finally { setPwBusy(false); }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHead title="Your profile" />
      <Panel className="overflow-hidden">
        {u.coverPic?.[0] ? <img src={u.coverPic[0].secure_url} alt="" className="h-36 w-full object-cover" /> : <div className="h-20 bg-brand-soft" />}
        <div className="flex flex-wrap items-center gap-4 p-5">
          <Avatar size={72} name={fullName(u)} src={u.profilePic?.secure_url ?? undefined} />
          <div className="flex-1">
            <h2 className="text-xl font-bold">{fullName(u)}</h2>
            <p className="text-sm text-muted">{u.email}</p>
            <div className="mt-1.5 flex gap-1.5"><Badge tone="brand">{u.role === "ADMIN" ? "Admin" : "Member"}</Badge>{u.provider === "GOOGLE" && <Badge>Google account</Badge>}</div>
          </div>
          <div className="flex flex-wrap gap-2">
            <FileDrop accept="image/png,image/jpeg,image/gif" maxBytes={MAX_FILE} label={u.profilePic?.secure_url ? "Change photo" : "Add photo"} onFiles={images((x) => userApi.uploadProfilePic(x[0]), "Photo updated.")} />
            {u.profilePic?.secure_url && <Button size="sm" variant="ghost" onClick={() => act("Photo removed.", userApi.deleteProfilePic)}>Remove</Button>}
            <FileDrop accept="image/png,image/jpeg,image/gif" multiple maxBytes={MAX_FILE} label="Add covers" onFiles={images((x) => userApi.uploadCovers(x.slice(0, 5)), "Covers added.")} />
          </div>
        </div>
        {(u.coverPic?.length ?? 0) > 0 && (
          <ul className="flex gap-2 overflow-x-auto border-t border-line p-3">
            {u.coverPic!.map((p) => (
              <li key={p.public_id} className="relative shrink-0">
                <img src={p.secure_url} alt="" className="h-16 w-28 rounded-lg object-cover" />
                <button aria-label="Delete cover picture" onClick={() => act("Cover removed.", () => userApi.deleteCover(p.public_id))} className="absolute top-1 right-1 rounded bg-surface/90 p-1 text-bad"><Trash2 size={13} /></button>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel className="p-5">
        <h2 className="mb-4 font-bold">Personal details</h2>
        <form onSubmit={save} className="space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="First name">{(id) => <TextInput id={id} minLength={2} maxLength={25} value={f.firstName} onChange={(e) => setF({ ...f, firstName: e.target.value })} />}</Field>
            <Field label="Last name">{(id) => <TextInput id={id} minLength={2} maxLength={25} value={f.lastName} onChange={(e) => setF({ ...f, lastName: e.target.value })} />}</Field>
            <Field label="Mobile number" hint="With country code, digits only.">{(id) => <TextInput id={id} type="tel" value={f.mobileNumber} onChange={(e) => setF({ ...f, mobileNumber: e.target.value })} />}</Field>
            <Field label="Date of birth" hint="You must be at least 18.">{(id) => <TextInput id={id} type="date" required value={f.DOB} onChange={(e) => setF({ ...f, DOB: e.target.value })} />}</Field>
            <Field label="Gender">{(id) => <Select id={id} value={f.gender} onChange={(e) => setF({ ...f, gender: e.target.value as "" })}><option value="">Not set</option><option value="FEMALE">Female</option><option value="MALE">Male</option></Select>}</Field>
          </div>
          {err && <p role="alert" className="rounded-lg bg-bad-soft px-3 py-2 text-sm text-bad">{err}</p>}
          <div className="flex justify-end"><Button type="submit" loading={busy}>Save profile</Button></div>
        </form>
      </Panel>

      {u.provider !== "GOOGLE" && (
        <Panel className="p-5">
          <h2 className="mb-4 font-bold">Change password</h2>
          <form onSubmit={changePw} className="grid gap-4 sm:grid-cols-2">
            <Field label="Current password">{(id) => <TextInput id={id} type="password" autoComplete="current-password" required value={pw.oldPassword} onChange={(e) => setPw({ ...pw, oldPassword: e.target.value })} />}</Field>
            <Field label="New password" hint="8 characters or more.">{(id) => <TextInput id={id} type="password" autoComplete="new-password" required minLength={8} value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} />}</Field>
            <div className="sm:col-span-2 flex justify-end"><Button type="submit" loading={pwBusy} disabled={pw.newPassword.length < 8 || !pw.oldPassword}>Change password</Button></div>
          </form>
        </Panel>
      )}

      <Panel className="border-bad/30 p-5">
        <h2 className="font-bold text-bad">Delete account</h2>
        <p className="mt-1 text-sm text-muted">You'll be signed out and won't be able to sign in again.</p>
        <Button className="mt-3" variant="danger" onClick={() => setConfirm(true)}>Delete my account</Button>
      </Panel>
      {confirm && (
        <Modal title="Delete your account?" onClose={() => setConfirm(false)}>
          <p className="text-sm">This signs you out everywhere and blocks future sign-ins.</p>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setConfirm(false)}>Keep account</Button>
            <Button variant="danger" onClick={async () => { try { await userApi.softDelete(); logout(); nav("/login"); } catch (e) { toast(errorText(e), "error"); } }}>Delete account</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
