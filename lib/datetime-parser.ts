/**
 * 日本語の日時表現をパースして { start: Date, end: Date } を返す
 * パース失敗時は null を返す
 */
export function parseJaDatetime(text: string): { start: Date; end: Date } | null {
  const now = new Date();
  const todayJst = getJstDate(now);

  // 日付部分を解決
  const date = resolveDate(text, todayJst);
  if (!date) return null;

  // 時間範囲を解決
  const times = resolveTimes(text);
  if (!times) return null;

  const start = new Date(date);
  start.setHours(times.startH, times.startM, 0, 0);

  const end = new Date(date);
  end.setHours(times.endH, times.endM, 0, 0);

  if (end <= start) return null;

  return { start, end };
}

function getJstDate(d: Date): Date {
  const jst = new Date(d.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" }));
  jst.setHours(0, 0, 0, 0);
  return jst;
}

function resolveDate(text: string, today: Date): Date | null {
  const WEEKDAYS: Record<string, number> = {
    日: 0, 月: 1, 火: 2, 水: 3, 木: 4, 金: 5, 土: 6,
  };

  // 今日・明日・明後日
  if (/今日/.test(text)) return new Date(today);
  if (/明日/.test(text)) {
    const d = new Date(today);
    d.setDate(d.getDate() + 1);
    return d;
  }
  if (/明後日/.test(text)) {
    const d = new Date(today);
    d.setDate(d.getDate() + 2);
    return d;
  }

  // 来週X曜
  const nextWeekMatch = text.match(/来週([月火水木金土日])曜/);
  if (nextWeekMatch) {
    const target = WEEKDAYS[nextWeekMatch[1]];
    const d = new Date(today);
    d.setDate(d.getDate() + 7);
    while (d.getDay() !== target) d.setDate(d.getDate() + 1);
    return d;
  }

  // X曜・X曜日（直近）
  const weekdayMatch = text.match(/([月火水木金土日])曜/);
  if (weekdayMatch) {
    const target = WEEKDAYS[weekdayMatch[1]];
    const d = new Date(today);
    d.setDate(d.getDate() + 1); // 明日以降
    while (d.getDay() !== target) d.setDate(d.getDate() + 1);
    return d;
  }

  // M/D or M月D日
  const slashMatch = text.match(/(\d{1,2})\/(\d{1,2})/);
  if (slashMatch) {
    const m = parseInt(slashMatch[1]) - 1;
    const day = parseInt(slashMatch[2]);
    const d = new Date(today);
    d.setMonth(m, day);
    if (d < today) d.setFullYear(d.getFullYear() + 1);
    return d;
  }

  const kanjiMatch = text.match(/(\d{1,2})月(\d{1,2})日/);
  if (kanjiMatch) {
    const m = parseInt(kanjiMatch[1]) - 1;
    const day = parseInt(kanjiMatch[2]);
    const d = new Date(today);
    d.setMonth(m, day);
    if (d < today) d.setFullYear(d.getFullYear() + 1);
    return d;
  }

  return null;
}

function resolveTimes(text: string): { startH: number; startM: number; endH: number; endM: number } | null {
  // HH:MM〜HH:MM / HH:MM-HH:MM / HH:MMからHH:MM
  const rangeColon = text.match(/(\d{1,2}):(\d{2})\s*[〜~\-からー]\s*(\d{1,2}):(\d{2})/);
  if (rangeColon) {
    return {
      startH: parseInt(rangeColon[1]), startM: parseInt(rangeColon[2]),
      endH: parseInt(rangeColon[3]), endM: parseInt(rangeColon[4]),
    };
  }

  // X時Y分〜X時Y分 / X時〜X時
  const rangeKanji = text.match(/(\d{1,2})時(?:(\d{1,2})分)?\s*[〜~\-からー]\s*(\d{1,2})時(?:(\d{1,2})分)?/);
  if (rangeKanji) {
    return {
      startH: parseInt(rangeKanji[1]), startM: parseInt(rangeKanji[2] ?? "0"),
      endH: parseInt(rangeKanji[3]), endM: parseInt(rangeKanji[4] ?? "0"),
    };
  }

  // X時からY時間
  const durationMatch = text.match(/(\d{1,2})時(?:(\d{1,2})分)?\s*から\s*(\d{1,2})\s*時間/);
  if (durationMatch) {
    const startH = parseInt(durationMatch[1]);
    const startM = parseInt(durationMatch[2] ?? "0");
    const dur = parseInt(durationMatch[3]);
    const endH = startH + dur;
    return { startH, startM, endH, endM: startM };
  }

  // HH:MMからY時間
  const durationColon = text.match(/(\d{1,2}):(\d{2})\s*から\s*(\d{1,2})\s*時間/);
  if (durationColon) {
    const startH = parseInt(durationColon[1]);
    const startM = parseInt(durationColon[2]);
    const dur = parseInt(durationColon[3]);
    return { startH, startM, endH: startH + dur, endM: startM };
  }

  // 午前/午後 X時〜X時
  const ampmRange = text.match(/(午前|午後)(\d{1,2})時\s*[〜~\-からー]\s*(午前|午後)?(\d{1,2})時/);
  if (ampmRange) {
    let startH = parseInt(ampmRange[2]);
    if (ampmRange[1] === "午後" && startH < 12) startH += 12;
    let endH = parseInt(ampmRange[4]);
    const endAmPm = ampmRange[3] ?? ampmRange[1];
    if (endAmPm === "午後" && endH < 12) endH += 12;
    return { startH, startM: 0, endH, endM: 0 };
  }

  return null;
}
