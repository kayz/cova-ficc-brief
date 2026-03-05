const chinaDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Shanghai",
  year: "numeric",
  month: "2-digit",
  day: "2-digit"
});

const chinaHourFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Shanghai",
  hour: "2-digit",
  hourCycle: "h23"
});

const chinaMinuteFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Shanghai",
  minute: "2-digit"
});

export const getChinaDateKey = (now: Date): string => {
  return chinaDateFormatter.format(now);
};

export const shouldRunDailyBriefAt = (
  now: Date,
  lastRunDateKey: string | null
): boolean => {
  const dateKey = getChinaDateKey(now);
  if (dateKey === lastRunDateKey) return false;
  const hour = Number(chinaHourFormatter.format(now));
  const minute = Number(chinaMinuteFormatter.format(now));
  return hour === 4 && minute === 0;
};

