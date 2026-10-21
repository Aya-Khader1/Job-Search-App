import { useEffect, useState } from "react";

export const deviceSupported = () => typeof window !== "undefined" && "Notification" in window;
export const devicePermission = (): NotificationPermission | "unsupported" => (deviceSupported() ? Notification.permission : "unsupported");

export function registerServiceWorker() {
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => { /* notifications fall back to the page */ });
}

export interface DeviceNotice { title: string; body: string; url?: string; tag?: string }

/** Shows an operating-system notification. Needs permission, which must be requested from a click. */
export async function showDeviceNotification(n: DeviceNotice): Promise<boolean> {
  if (!deviceSupported() || Notification.permission !== "granted") return false;
  const options: NotificationOptions = { body: n.body, tag: n.tag, icon: "/icon.png", badge: "/icon.png", data: { url: n.url ?? "/notifications" } };
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) { await reg.showNotification(n.title, options); return true; }
  } catch { /* try the page API below */ }
  try {
    const x = new Notification(n.title, options);
    x.onclick = () => { window.focus(); window.dispatchEvent(new CustomEvent("app:navigate", { detail: n.url ?? "/notifications" })); x.close(); };
    return true;
  } catch { return false; }
}

export async function requestDevicePermission() {
  if (!deviceSupported()) return "unsupported" as const;
  return Notification.requestPermission();
}

export function useDevicePermission() {
  const [perm, setPerm] = useState(devicePermission());
  useEffect(() => {
    // Keep in sync if the person changes it in browser settings.
    let status: PermissionStatus | undefined;
    const sync = () => setPerm(devicePermission());
    navigator.permissions?.query({ name: "notifications" as PermissionName }).then((s) => { status = s; s.addEventListener("change", sync); }).catch(() => {});
    return () => status?.removeEventListener("change", sync);
  }, []);
  const ask = async () => { await requestDevicePermission(); setPerm(devicePermission()); };
  return { perm, ask };
}
