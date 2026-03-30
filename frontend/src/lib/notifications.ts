export async function requestPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

export function notify(title: string, body: string) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  new Notification(title, {
    body,
    icon: "/favicon.ico",
    badge: "/favicon.ico",
  });
}

const scheduledTimers: number[] = [];

export function scheduleNotification(title: string, body: string, delayMs: number) {
  const timer = window.setTimeout(() => notify(title, body), delayMs);
  scheduledTimers.push(timer);
  return timer;
}

export function clearAllScheduled() {
  scheduledTimers.forEach((t) => clearTimeout(t));
  scheduledTimers.length = 0;
}
