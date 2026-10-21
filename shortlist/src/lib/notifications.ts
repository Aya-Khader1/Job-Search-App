import { Bell, BriefcaseBusiness, CalendarClock, CircleCheck, Info, MessageSquare, ShieldCheck } from "lucide-react";
import type { AppNotification } from "./types";

const kind = (n: AppNotification) => n.type.toLowerCase();

export function iconFor(n: AppNotification) {
  const k = kind(n);
  if (k.includes("application_status")) return CircleCheck;
  if (k.includes("application")) return BriefcaseBusiness;
  if (k.includes("message")) return MessageSquare;
  if (k.includes("interview")) return CalendarClock;
  if (k.includes("company")) return ShieldCheck;
  if (k.includes("system")) return Info;
  return Bell;
}

/** Where a notification should take the person when clicked. */
export function targetFor(n: AppNotification): string {
  const k = kind(n);
  if (k.includes("application_status")) return "/jobs";
  if (k.includes("application")) return "/employer";
  if (k.includes("message")) return "/messages";
  if (k.includes("company")) return "/employer";
  return "/notifications";
}

