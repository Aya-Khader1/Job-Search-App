import { BellRing, BellOff } from "lucide-react";
import { showDeviceNotification, useDevicePermission } from "../lib/device";
import { useToast } from "../lib/toast";
import { Button } from "./ui";

/** Lets the person turn on, and test, operating-system notifications. */
export default function DeviceAlerts({ compact }: { compact?: boolean }) {
  const { perm, ask } = useDevicePermission();
  const toast = useToast();
  if (perm === "unsupported") return null;

  const test = async () => {
    const ok = await showDeviceNotification({ title: "Shortlist", body: "Device notifications are working.", tag: "test" });
    if (!ok) toast("Couldn't show it. Check your system's notification settings.", "error");
  };

  const wrap = `flex items-center gap-3 ${compact ? "border-b border-line bg-marker-soft/60 px-4 py-2.5" : "mb-5 rounded-2xl border border-line bg-surface px-4 py-3"}`;
  if (perm === "granted") return (
    <div className={wrap}>
      <BellRing size={17} className="shrink-0 text-ok" />
      <p className="flex-1 text-[13px]">Device notifications are on.</p>
      <button onClick={test} className="text-[13px] font-semibold text-brand hover:underline">Send a test</button>
    </div>
  );
  if (perm === "denied") return (
    <div className={wrap}>
      <BellOff size={17} className="shrink-0 text-bad" />
      <p className="flex-1 text-[13px]">Blocked by your browser. Click the lock icon next to the address, then allow Notifications.</p>
    </div>
  );
  return (
    <div className={wrap}>
      <BellRing size={17} className="shrink-0 text-brand" />
      <p className="flex-1 text-[13px]">Get alerts on your device, even when this tab is in the background.</p>
      <Button size="sm" onClick={ask}>Turn on</Button>
    </div>
  );
}
