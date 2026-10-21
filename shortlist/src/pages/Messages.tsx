import { useEffect, useRef, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Send } from "lucide-react";
import { chatApi } from "../lib/endpoints";
import { errorText } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useRealtime, type ChatEvent, type Conversation } from "../lib/realtime";
import { timeAgo } from "../lib/format";
import { Avatar, Button, Empty, ErrorState, Panel, Spinner } from "../components/ui";

interface Msg { key: string; senderId: string; message: string; sentAt: string }

function Thread({ conv, onBack }: { conv: Conversation; onBack: () => void }) {
  const { user } = useAuth();
  const { socket, status, upsert, markRead, setActivePeer } = useRealtime();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [chatId, setChatId] = useState<string | null>(conv.chatId ?? null);
  const [text, setText] = useState("");
  const awaiting = useRef(0);
  const end = useRef<HTMLDivElement>(null);
  const q = useQuery({ queryKey: ["chat", conv.peerId], queryFn: () => chatApi.history(conv.peerId), staleTime: 0, gcTime: 0 });

  useEffect(() => {
    setActivePeer(conv.peerId); markRead(conv.peerId);
    return () => setActivePeer(null);
  }, [conv.peerId, setActivePeer, markRead]);

  useEffect(() => {
    if (!q.data) return;
    setChatId(q.data.chatId);
    setMsgs(q.data.messages.map((m, i) => ({
      key: m._id ?? `h${i}`, message: m.message, sentAt: m.sentAt,
      senderId: typeof m.senderId === "object" ? m.senderId._id : m.senderId,
    })));
    upsert({ peerId: conv.peerId, chatId: q.data.chatId });
  }, [q.data]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!socket) return;
    const incoming = (p: ChatEvent) => {
      if (p.senderId !== conv.peerId) return;
      setChatId(p.chatId);
      setMsgs((m) => [...m, { key: `i${p.sentAt}${m.length}`, senderId: p.senderId, message: p.message, sentAt: p.sentAt }]);
    };
    const sent = (p: ChatEvent) => {
      if (awaiting.current <= 0) return;
      awaiting.current--;
      setChatId(p.chatId);
      setMsgs((m) => [...m, { key: `s${p.sentAt}${m.length}`, senderId: user!._id, message: p.message, sentAt: p.sentAt }]);
      upsert({ peerId: conv.peerId, chatId: p.chatId, lastMessage: p.message, lastAt: p.sentAt });
    };
    socket.on("newMessage", incoming);
    socket.on("messageSent", sent);
    return () => { socket.off("newMessage", incoming); socket.off("messageSent", sent); };
  }, [socket, conv.peerId, user, upsert]);

  useEffect(() => { end.current?.scrollIntoView({ block: "end" }); }, [msgs.length, q.isPending]);

  const canStart = !chatId && !!conv.companyId;
  const canSend = status === "live" && (!!chatId || canStart);

  const send = (e: FormEvent) => {
    e.preventDefault();
    const message = text.trim();
    if (!message || !socket || !canSend) return;
    awaiting.current++;
    if (chatId) socket.emit("sendMessage", { chatId, message });
    else socket.emit("startConversation", { receiverId: conv.peerId, companyId: conv.companyId, message });
    setText("");
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-3 border-b border-line px-4 py-3">
        <button onClick={onBack} aria-label="Back to conversations" className="rounded-md p-1 text-muted hover:bg-paper lg:hidden"><ArrowLeft size={18} /></button>
        <Avatar name={conv.name || "?"} size={36} />
        <p className="font-bold">{conv.name || "Someone"}</p>
      </div>
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-4 py-4">
        {q.isPending ? <Spinner /> : q.isError ? <ErrorState message={errorText(q.error)} onRetry={() => q.refetch()} /> : msgs.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted">{canStart ? "No messages yet. Say hello." : "No messages yet. Only the company can start this conversation."}</p>
        ) : msgs.map((m) => {
          const mine = m.senderId === user?._id;
          return (
            <div key={m.key} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[78%] rounded-2xl px-3.5 py-2 text-[15px] ${mine ? "rounded-br-md bg-brand text-white" : "rounded-bl-md bg-paper"}`}>
                <p className="break-words whitespace-pre-wrap">{m.message}</p>
                <p className={`mt-0.5 text-[11px] ${mine ? "text-white/70" : "text-faint"}`}>{timeAgo(m.sentAt)}</p>
              </div>
            </div>
          );
        })}
        <div ref={end} />
      </div>
      <form onSubmit={send} className="flex gap-2 border-t border-line p-3">
        <input aria-label="Message" value={text} onChange={(e) => setText(e.target.value)} disabled={!canSend}
          placeholder={status !== "live" ? "Live chat is offline" : canSend ? "Write a message" : "Waiting for the company to start the conversation"}
          className="h-10 flex-1 rounded-lg border border-line bg-surface px-3 text-[15px] outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:bg-paper" />
        <Button type="submit" disabled={!canSend || !text.trim()} aria-label="Send"><Send size={16} /></Button>
      </form>
    </div>
  );
}

export default function Messages() {
  const { conversations, upsert, status } = useRealtime();
  const [params, setParams] = useSearchParams();
  const to = params.get("to");

  // Arriving from an applicant row: register the conversation so it shows up in the list.
  useEffect(() => {
    const name = params.get("name"), company = params.get("company");
    if (to) upsert({ peerId: to, ...(name ? { name } : {}), ...(company ? { companyId: company } : {}) });
  }, [to]); // eslint-disable-line react-hooks/exhaustive-deps

  const active = conversations.find((c) => c.peerId === to) ?? null;
  const open = (id: string | null) => setParams(id ? { to: id } : {}, { replace: true });

  return (
    <div>
      <header className="mb-5 flex items-end justify-between gap-3">
        <h1 className="text-3xl font-extrabold">Messages</h1>
        {status !== "live" && <p className="rounded-lg bg-warn-soft px-3 py-1.5 text-sm text-warn" role="status">Live chat is {status === "connecting" ? "connecting…" : "offline. Check that the backend's Socket.IO server is running."}</p>}
      </header>
      <Panel className="grid h-[calc(100vh-13rem)] min-h-[420px] overflow-hidden lg:grid-cols-[20rem_1fr]">
        <div className={`${active ? "hidden lg:block" : ""} overflow-y-auto border-r border-line`}>
          {conversations.length === 0 ? <Empty title="No conversations yet">Employers start conversations from an applicant's row. Replies show up here.</Empty> : (
            <ul className="divide-y divide-line">
              {conversations.map((c) => (
                <li key={c.peerId}>
                  <button onClick={() => open(c.peerId)} className={`flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-paper ${c.peerId === to ? "bg-brand-soft/60" : ""}`}>
                    <Avatar name={c.name || "?"} size={40} />
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center justify-between gap-2"><span className="truncate font-semibold">{c.name || "Someone"}</span><span className="shrink-0 text-xs text-faint">{c.lastMessage && timeAgo(c.lastAt)}</span></p>
                      <p className="truncate text-sm text-muted">{c.lastMessage || "New conversation"}</p>
                    </div>
                    {c.unread > 0 && <span className="rounded-full bg-marker px-2 text-xs font-bold">{c.unread}</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className={`${active ? "" : "hidden lg:block"} min-h-0`}>
          {active ? <Thread key={active.peerId} conv={active} onBack={() => open(null)} /> : <Empty title="Choose a conversation" />}
        </div>
      </Panel>
    </div>
  );
}
