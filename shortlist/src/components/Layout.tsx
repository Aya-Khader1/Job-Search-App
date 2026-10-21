import { useEffect } from "react";
import { NavLink, Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { Briefcase, Building2, LogOut, MessageSquare, Shield, User as UserIcon, Wifi, WifiOff } from "lucide-react";
import { useAuth } from "../lib/auth";
import { useRealtime } from "../lib/realtime";
import { Avatar } from "./ui";
import NotificationBell from "./NotificationBell";
import { fullName } from "../lib/format";

export const Logo = ({ light }: { light?: boolean }) => (
  <span className={`font-display text-xl font-extrabold ${light ? "text-white" : "text-ink"}`}>
    <span className={light ? "rounded-sm bg-marker px-1 text-ink" : "bg-[linear-gradient(transparent_55%,var(--color-marker)_55%,var(--color-marker)_95%,transparent_95%)] px-0.5"}>Short</span>list
  </span>
);

export default function Layout() {
  const { user, isAdmin, logout } = useAuth();
  const { unread, status } = useRealtime();
  const nav = useNavigate();
  const loc = useLocation();
  useEffect(() => {
    const go = (url: string) => nav(url);
    const fromSw = (e: MessageEvent) => e.data?.type === "navigate" && go(e.data.url);
    const fromPage = (e: Event) => go((e as CustomEvent<string>).detail);
    navigator.serviceWorker?.addEventListener("message", fromSw);
    window.addEventListener("app:navigate", fromPage);
    return () => { navigator.serviceWorker?.removeEventListener("message", fromSw); window.removeEventListener("app:navigate", fromPage); };
  }, [nav]);
  const link = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold transition-all duration-200 ${isActive ? "bg-ink text-white shadow-md" : "text-muted hover:bg-white hover:text-ink"}`;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-white/60 glass">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-2 px-4">
          <Link to="/jobs" className="mr-3" aria-label="Shortlist home"><Logo /></Link>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
            <NavLink to="/jobs" className={link}><Briefcase size={16} />Jobs</NavLink>
            <NavLink to="/companies" className={link}><Building2 size={16} />Companies</NavLink>
            <NavLink to="/employer" className={link}>For employers</NavLink>
            <NavLink to="/messages" className={link}>
              <MessageSquare size={16} />Messages
              {unread > 0 && <span className="rounded-full bg-marker px-1.5 text-xs font-bold text-ink">{unread}</span>}
            </NavLink>
            {isAdmin && <NavLink to="/admin" className={link}><Shield size={16} />Admin</NavLink>}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <span title={status === "live" ? "Live updates connected" : "Live updates offline"} className={`hidden items-center gap-1 text-xs sm:flex ${status === "live" ? "text-ok" : "text-faint"}`}>
              {status === "live" ? <Wifi size={14} /> : <WifiOff size={14} />}{status === "live" ? "Live" : "Offline"}
            </span>
            <NotificationBell />
            <Link to="/profile" className="flex items-center gap-2 rounded-lg p-1 pr-2 hover:bg-paper" aria-label="Your profile">
              <Avatar name={fullName(user)} src={user?.profilePic?.secure_url} size={30} />
              <span className="hidden text-sm font-semibold lg:block">{user?.firstName}</span>
            </Link>
            <button onClick={() => { logout(); nav("/login"); }} aria-label="Sign out" className="rounded-lg p-2 text-muted hover:bg-paper hover:text-ink"><LogOut size={18} /></button>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto border-t border-line px-3 py-1 md:hidden" aria-label="Main">
          <NavLink to="/jobs" className={link}>Jobs</NavLink>
          <NavLink to="/companies" className={link}>Companies</NavLink>
          <NavLink to="/employer" className={link}>Employers</NavLink>
          <NavLink to="/messages" className={link}>Messages{unread > 0 && <span className="rounded-full bg-marker px-1.5 text-xs font-bold">{unread}</span>}</NavLink>
          <NavLink to="/profile" className={link}><UserIcon size={15} />Profile</NavLink>
          {isAdmin && <NavLink to="/admin" className={link}>Admin</NavLink>}
        </nav>
      </header>
      <main key={loc.pathname} className="fade-up mx-auto max-w-7xl px-4 py-8"><Outlet /></main>
    </div>
  );
}
