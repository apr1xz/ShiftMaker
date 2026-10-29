export const STORAGE_KEY = 'shiftmaker.personal.v1';
export function dateKey(year, month, day) {
  return `${String(year).padStart(4, '0')}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}
export function validDate(key) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return false;
  const [y, m, d] = key.split('-').map(Number);
  return y >= 1900 && y <= 9999 && m >= 1 && m <= 12 && d >= 1 && d <= new Date(y, m, 0).getDate();
}
export function validateData(data) {
  if (!data || data.version !== 1 || !data.shifts || typeof data.shifts !== 'object' || Array.isArray(data.shifts)) throw new Error('Shift Makerのバックアップを選んでください。');
  const clean = {};
  for (const [key, shift] of Object.entries(data.shifts)) {
    if (!validDate(key) || !shift || !['early','late','custom','off','free'].includes(shift.kind)) throw new Error('日付またはシフトの形式が正しくありません。');
    const { kind, start, end } = shift;
    if (['off','free'].includes(kind)) {
      if (start !== '' || end !== '') throw new Error('時間の形式が正しくありません。');
    } else if (![start, end].every(t => typeof t === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(t)) || start === end) throw new Error('開始・終了時刻を確認してください。');
    clean[key] = { kind, start, end };
  }
  return { version: 1, shifts: clean };
}
export function duration(shift) {
  if (!shift || !shift.start || !shift.end) return 0;
  const minutes = t => Number(t.slice(0,2)) * 60 + Number(t.slice(3));
  let diff = minutes(shift.end) - minutes(shift.start);
  if (diff < 0) diff += 1440;
  return diff;
}
