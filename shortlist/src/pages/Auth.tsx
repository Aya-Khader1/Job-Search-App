import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { authApi } from "../lib/endpoints";
import { errorText } from "../lib/api";
import { useToast } from "../lib/toast";
import { Button, Field, TextInput } from "../components/ui";
import { Logo } from "../components/Layout";

declare global { interface Window { google?: any } }  // eslint-disable-line @typescript-eslint/no-explicit-any

const GOOGLE_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

function Shell({ title, sub, children }: { title: string; sub?: string; children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-[#2623d6] via-brand to-[#6f3cf2] p-12 pb-20 text-white lg:flex">
        <div className="hero-grid absolute inset-0" aria-hidden />
        <div className="blob absolute -top-20 -right-16 h-80 w-80 rounded-full bg-marker/40 blur-3xl" aria-hidden />
        <div className="blob absolute bottom-0 left-1/4 h-80 w-80 rounded-full bg-[#ff7ac6]/30 blur-3xl" style={{ animationDelay: "-7s" }} aria-hidden />
        <div className="relative"><Logo light /></div>
        <div className="fade-up relative max-w-md">
          <h2 className="text-5xl leading-[1.05] font-extrabold">Search open roles. Apply with a PDF. Hear back by email.</h2>
          <p className="mt-6 text-lg text-white/80">Hiring? Post a role, review CVs in one list, accept or reject, and message the people you want to talk to.</p>
        </div>
      </aside>
      <div className="flex items-center justify-center px-5 py-10">
        <div className="fade-up w-full max-w-sm rounded-3xl bg-surface p-8 shadow-soft">
          <div className="mb-8 lg:hidden"><Logo /></div>
          <h1 className="text-3xl font-extrabold">{title}</h1>
          {sub && <p className="mt-1.5 text-muted">{sub}</p>}
          <div className="mt-7">{children}</div>
        </div>
      </div>
    </div>
  );
}

function GoogleButton({ onToken }: { onToken: (t: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const cb = useRef(onToken);
  cb.current = onToken;
  useEffect(() => {
    if (!GOOGLE_ID) return;
    const timer = setInterval(() => {
      if (!window.google?.accounts?.id || !ref.current) return;
      clearInterval(timer);
      window.google.accounts.id.initialize({ client_id: GOOGLE_ID, callback: (r: { credential: string }) => cb.current(r.credential) });
      window.google.accounts.id.renderButton(ref.current, { theme: "outline", size: "large", width: 352, text: "continue_with" });
    }, 150);
    return () => clearInterval(timer);
  }, []);
  if (!GOOGLE_ID) return null;
  return (
    <>
      <div ref={ref} className="flex min-h-[44px] justify-center" />
      <div className="my-5 flex items-center gap-3 text-xs text-faint"><span className="h-px flex-1 bg-line" />or use your email<span className="h-px flex-1 bg-line" /></div>
    </>
  );
}

const ErrorLine = ({ children }: { children: ReactNode }) => (
  <p role="alert" className="rounded-lg bg-bad-soft px-3 py-2 text-sm text-bad">{children}</p>
);

/* ───────── login ───────── */
export function Login() {
  const { user, login, loginWithGoogle } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const toast = useToast();
  const prefill = (loc.state as { email?: string } | null)?.email ?? "";
  const [email, setEmail] = useState(prefill);
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const from = (loc.state as { from?: string } | null)?.from ?? "/jobs";

  if (user) return <Navigate to={from} replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(""); setBusy(true);
    try { await login(email.trim(), password); nav(from, { replace: true }); }
    catch (x) { setErr(errorText(x)); }
    finally { setBusy(false); }
  };

  return (
    <Shell title="Sign in" sub="Welcome back.">
      <GoogleButton onToken={async (t) => { try { await loginWithGoogle(t); nav(from, { replace: true }); } catch (x) { toast(errorText(x), "error"); } }} />
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Email">{(id) => <TextInput id={id} type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />}</Field>
        <Field label="Password">{(id) => <TextInput id={id} type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />}</Field>
        {err && (
          <ErrorLine>
            {err}
            {err === "Invalid Account" && <> Haven't confirmed your email yet? <Link className="font-semibold underline" to={`/verify?email=${encodeURIComponent(email)}`}>Enter your code</Link>.</>}
          </ErrorLine>
        )}
        <Button type="submit" loading={busy} className="w-full">Sign in</Button>
      </form>
      <div className="mt-5 flex justify-between text-sm">
        <Link to="/forgot-password" className="font-medium text-brand hover:underline">Forgot password?</Link>
        <span className="text-muted">New here? <Link to="/signup" className="font-semibold text-brand hover:underline">Create an account</Link></span>
      </div>
    </Shell>
  );
}

/* ───────── signup ───────── */
export function Signup() {
  const nav = useNavigate();
  const [f, setF] = useState({ username: "", email: "", mobileNumber: "", password: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  const validate = () => {
    const words = f.username.trim().split(/\s+/);
    // The backend splits the name into first and last name and needs both (2–25 characters in total).
    if (words.length < 2 || words.some((w) => w.length < 2)) return "Enter your first and last name.";
    if (f.username.trim().length > 25) return "Your name can be at most 25 characters.";
    if (!/^\+?[1-9]\d{7,14}$/.test(f.mobileNumber)) return "Enter a mobile number with country code, digits only (for example +970599123456).";
    if (f.password.length < 8) return "Password must be at least 8 characters.";
    return "";
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const v = validate();
    if (v) return setErr(v);
    setErr(""); setBusy(true);
    try {
      await authApi.signup({ ...f, username: f.username.trim().replace(/\s+/g, " "), email: f.email.trim() });
      nav(`/verify?email=${encodeURIComponent(f.email.trim())}`);
    } catch (x) { setErr(errorText(x)); }
    finally { setBusy(false); }
  };

  return (
    <Shell title="Create your account" sub="We'll email you a 6-digit code to confirm it.">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Full name">{(id) => <TextInput id={id} autoComplete="name" required value={f.username} onChange={set("username")} placeholder="Ayah Khader" />}</Field>
        <Field label="Email">{(id) => <TextInput id={id} type="email" autoComplete="email" required value={f.email} onChange={set("email")} />}</Field>
        <Field label="Mobile number" hint="With country code, digits only.">{(id) => <TextInput id={id} type="tel" autoComplete="tel" required value={f.mobileNumber} onChange={set("mobileNumber")} placeholder="+970599123456" />}</Field>
        <Field label="Password" hint="8 characters or more.">{(id) => <TextInput id={id} type="password" autoComplete="new-password" required value={f.password} onChange={set("password")} />}</Field>
        {err && <ErrorLine>{err}</ErrorLine>}
        <Button type="submit" loading={busy} className="w-full">Create account</Button>
      </form>
      <p className="mt-5 text-sm text-muted">Already have an account? <Link to="/login" className="font-semibold text-brand hover:underline">Sign in</Link></p>
    </Shell>
  );
}

/* ───────── verify email ───────── */
export function Verify() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const toast = useToast();
  const [email, setEmail] = useState(params.get("email") ?? "");
  const [otp, setOtp] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(""); setBusy(true);
    try {
      await authApi.confirmEmail({ email: email.trim(), otp });
      toast("Email confirmed. You can sign in now.", "ok");
      nav("/login", { state: { email: email.trim() } });
    } catch (x) { setErr(errorText(x)); }
    finally { setBusy(false); }
  };
  const resend = async () => {
    try { await authApi.resendOtp(email.trim()); toast("A new code is on its way.", "ok"); }
    catch (x) { toast(errorText(x), "error"); }
  };

  return (
    <Shell title="Confirm your email" sub="Enter the 6-digit code we sent. It expires in 10 minutes.">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Email">{(id) => <TextInput id={id} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />}</Field>
        <Field label="Code">{(id) => <TextInput id={id} inputMode="numeric" autoComplete="one-time-code" maxLength={6} required value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} className="font-display text-center text-2xl tracking-[0.5em]" />}</Field>
        {err && <ErrorLine>{err}</ErrorLine>}
        <Button type="submit" loading={busy} disabled={otp.length !== 6} className="w-full">Confirm email</Button>
      </form>
      <button onClick={resend} disabled={!email} className="mt-4 text-sm font-semibold text-brand hover:underline disabled:opacity-50">Send a new code</button>
    </Shell>
  );
}

/* ───────── forgot password ───────── */
export function ForgotPassword() {
  const nav = useNavigate();
  const toast = useToast();
  const [step, setStep] = useState<"email" | "reset">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const run = (fn: () => Promise<void>) => async (e: FormEvent) => {
    e.preventDefault();
    setErr(""); setBusy(true);
    try { await fn(); } catch (x) { setErr(errorText(x)); } finally { setBusy(false); }
  };

  return step === "email" ? (
    <Shell title="Reset your password" sub="We'll email you a code to set a new one.">
      <form onSubmit={run(async () => { await authApi.forgotPassword(email.trim()); setStep("reset"); })} className="space-y-4" noValidate>
        <Field label="Email">{(id) => <TextInput id={id} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />}</Field>
        {err && <ErrorLine>{err}</ErrorLine>}
        <Button type="submit" loading={busy} className="w-full">Send code</Button>
      </form>
      <Link to="/login" className="mt-5 inline-block text-sm font-semibold text-brand hover:underline">Back to sign in</Link>
    </Shell>
  ) : (
    <Shell title="Choose a new password" sub={`Enter the code sent to ${email}.`}>
      <form onSubmit={run(async () => {
        await authApi.resetPassword({ email: email.trim(), otp, newPassword: pw });
        toast("Password changed. Sign in with the new one.", "ok");
        nav("/login", { state: { email: email.trim() } });
      })} className="space-y-4" noValidate>
        <Field label="Code">{(id) => <TextInput id={id} inputMode="numeric" maxLength={6} required value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} className="font-display text-center text-2xl tracking-[0.5em]" />}</Field>
        <Field label="New password" hint="8 characters or more.">{(id) => <TextInput id={id} type="password" autoComplete="new-password" required minLength={8} value={pw} onChange={(e) => setPw(e.target.value)} />}</Field>
        {err && <ErrorLine>{err}</ErrorLine>}
        <Button type="submit" loading={busy} disabled={otp.length !== 6 || pw.length < 8} className="w-full">Change password</Button>
      </form>
    </Shell>
  );
}
