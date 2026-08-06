export function formatPredictionWindow(windowStart: string, windowEnd: string): string {
  const hoursUntilStart = Math.round((new Date(windowStart).getTime() - Date.now()) / 3_600_000);
  const hoursUntilEnd = Math.round((new Date(windowEnd).getTime() - Date.now()) / 3_600_000);

  if (hoursUntilEnd <= 0) return "الفترة المتوقعة انتهت";
  if (hoursUntilStart <= 0) return `جارية الآن — حتى ${hoursUntilEnd} ساعة`;
  return `خلال ${hoursUntilStart}-${hoursUntilEnd} ساعة`;
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("ar-SA", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
