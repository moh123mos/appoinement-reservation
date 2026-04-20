export function pad2(value: number) {
  return String(value).padStart(2, "0");
}

export function minuteToTimeLabel(minute: number) {
  const hours = Math.floor(minute / 60);
  const minutes = minute % 60;
  return `${pad2(hours)}:${pad2(minutes)}`;
}

export function nextDaysIso(count: number) {
  const days: string[] = [];
  const now = new Date();

  for (let i = 0; i < count; i += 1) {
    const next = new Date(now);
    next.setDate(now.getDate() + i);
    days.push(next.toISOString().slice(0, 10));
  }

  return days;
}

export function formatDateArabic(isoDate: string) {
  return new Intl.DateTimeFormat("ar-EG", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(`${isoDate}T00:00:00`));
}

export function formatDateEnglish(isoDate: string) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  }).format(new Date(`${isoDate}T00:00:00`));
}
