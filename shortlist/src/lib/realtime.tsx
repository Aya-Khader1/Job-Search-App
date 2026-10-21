import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { io, type Socket } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";
import { API_URL, tokenStore } from "./api";
import { chatApi } from "./endpoints";
import { useAuth } from "./auth";
import { useToast } from "./toast";
import { fullName } from "./format";
import { showDeviceNotification } from "./device";
import { targetFor } from "./notifications";
import type { AppNotification } from "./types";

export interface Conversation {
  peerId: string;
  name: string;
  chatId?: string | null;
  lastMessage: string;
  lastAt: string;
  unread: number;
  companyId?: string;
}

export interface ChatEvent { chatId: string; senderId: string; message: string; sentAt: string }
type Status = "connecting" | "live" | "offline";

interface RealtimeValue {
  status: Status;
  socket: Socket | null;
  conversations: Conversation[];
  unread: number;
  upsert: (c: Partial<Conversation> & { peerId: string }) => void;
  markRead: (peerId: string) => void;
  setActivePeer: (peerId: string | null) => void;
}

const Ctx = createContext<RealtimeValue | null>(null);
export const useRealtime = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useRealtime outside RealtimeProvider");
  return v;
};

const convKey = (uid: string) => `shortlist.conversations.${uid}`;

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const toast = useToast();
  const qc = useQueryClient();
  const [status, setStatus] = useState<Status>("offline");
  const [socket, setSocket] = useState<Socket | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const activePeer = useRef<string | null>(null);
  const known = useRef<Set<string>>(new Set());

  // Load and persist the conversation list per user. The backend has no "list my chats" endpoint.
  useEffect(() => {
    if (!user) { setConversations([]); return; }
    try { setConversations(JSON.parse(localStorage.getItem(convKey(user._id)) ?? "[]")); } catch { setConversations([]); }
  }, [user?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!user) return;
    try { localStorage.setItem(convKey(user._id), JSON.stringify(conversations)); } catch { /* storage unavailable */ }
    known.current = new Set(conversations.filter((c) => c.name).map((c) => c.peerId));
  }, [conversations, user]);

  const upsert = useCallback((c: Partial<Conversation> & { peerId: string }) => {
    setConversations((list) => {
      const i = list.findIndex((x) => x.peerId === c.peerId);
      const base: Conversation = i >= 0 ? list[i] : { peerId: c.peerId, name: "", lastMessage: "", lastAt: new Date().toISOString(), unread: 0 };
      const next = { ...base, ...Object.fromEntries(Object.entries(c).filter(([, v]) => v !== undefined)) } as Conversation;
      const rest = list.filter((x) => x.peerId !== c.peerId);
      return [next, ...rest].sort((a, b) => b.lastAt.localeCompare(a.lastAt));
    });
  }, []);

  const markRead = useCallback((peerId: string) => {
    setConversations((list) => list.map((c) => (c.peerId === peerId ? { ...c, unread: 0 } : c)));
  }, []);
  const setActivePeer = useCallback((id: string | null) => { activePeer.current = id; }, []);

  useEffect(() => {
    if (!user) return;
    const tokens = tokenStore.get();
    if (!tokens) return;
    setStatus("connecting");
    const s = io(API_URL, { auth: { token: `Bearer ${tokens.accessToken}` }, reconnectionAttempts: 5, timeout: 6000 });
    setSocket(s);

    const refreshAuth = () => { const t = tokenStore.get(); if (t) s.auth = { token: `Bearer ${t.accessToken}` }; };
    window.addEventListener("auth:refreshed", refreshAuth);

    s.on("connect", () => setStatus("live"));
    s.on("disconnect", () => setStatus("offline"));
    s.on("connect_error", () => setStatus("offline"));
    s.on("error", (p: { message?: string }) => toast(p?.message ?? "Chat error", "error"));

    s.on("newNotification", (p: { id?: string; type: string; title: string; message: string }) => {
      toast(`${p.title}. ${p.message}`, "info");
      showDeviceNotification({ title: p.title, body: p.message, tag: p.id, url: targetFor({ type: p.type } as AppNotification) });
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["notif-count"] });
      qc.invalidateQueries({ queryKey: ["applications"] });
    });

    s.on("newMessage", async (p: ChatEvent) => {
      const open = activePeer.current === p.senderId;
      setConversations((list) => {
        const cur = list.find((c) => c.peerId === p.senderId);
        const next: Conversation = {
          peerId: p.senderId, name: cur?.name ?? "", chatId: p.chatId, lastMessage: p.message, lastAt: p.sentAt,
          unread: open ? 0 : (cur?.unread ?? 0) + 1, companyId: cur?.companyId,
        };
        return [next, ...list.filter((c) => c.peerId !== p.senderId)].sort((a, b) => b.lastAt.localeCompare(a.lastAt));
      });
      // Learn the sender's name from the populated history the first time we hear from them.
      let name = "";
      if (!known.current.has(p.senderId)) {
        try {
          const h = await chatApi.history(p.senderId);
          const m = h.messages.find((x) => typeof x.senderId === "object" && x.senderId._id === p.senderId);
          if (m && typeof m.senderId === "object") name = fullName(m.senderId);
          if (name) upsert({ peerId: p.senderId, name });
        } catch { /* name stays blank; shown as "Someone" */ }
      }
      if (!open) toast(`New message${name ? ` from ${name}` : ""}`, "info");
      if (!open || document.visibilityState !== "visible") {
        showDeviceNotification({ title: name ? `Message from ${name}` : "New message", body: p.message, tag: `msg-${p.senderId}`, url: `/messages?to=${p.senderId}` });
      }
    });

    return () => {
      window.removeEventListener("auth:refreshed", refreshAuth);
      s.removeAllListeners();
      s.disconnect();
      setSocket(null);
      setStatus("offline");
    };
  }, [user?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  const value = useMemo<RealtimeValue>(
    () => ({ status, socket, conversations, unread: conversations.reduce((n, c) => n + c.unread, 0), upsert, markRead, setActivePeer }),
    [status, socket, conversations, upsert, markRead, setActivePeer],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
